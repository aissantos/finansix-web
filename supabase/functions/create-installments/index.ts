// supabase/functions/create-installments/index.ts
// Edge Function: Installment Explosion
// Called via database trigger or directly via API

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { addMonths, format, setDate } from 'https://esm.sh/date-fns@3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TransactionPayload {
  id: string
  household_id: string
  credit_card_id: string | null
  amount: number
  transaction_date: string
  is_installment: boolean
  total_installments: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Verify User (Authentication & identification for rate limiting)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid User Token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2. Rate Limiting Check
    const rateKey = `create-installments:${user.id}`
    const { data: isAllowed, error: rateError } = await supabase.rpc('check_rate_limit', {
      rate_key: rateKey,
      max_requests: 100, // 100 requests per minute
      window_seconds: 60
    })

    if (rateError) {
       console.error('Rate limit RPC error:', rateError)
       // Fail safe: Allow if RPC fails? Or Deny? Deny is safer for stability.
       return new Response(JSON.stringify({ error: 'Rate limit system error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (!isAllowed) {
       return new Response(JSON.stringify({ error: 'Rate limit exceeded (100 req/min). Please try again later.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const payload: TransactionPayload = await req.json()
    const { id, household_id, credit_card_id, amount, transaction_date, is_installment, total_installments } = payload

    // Skip if not an installment transaction
    if (!is_installment || total_installments <= 1 || !credit_card_id) {
      return new Response(
        JSON.stringify({ message: 'Not an installment transaction', installments_created: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get credit card details for billing calculation
    const { data: card, error: cardError } = await supabase
      .from('credit_cards')
      .select('id, closing_day, due_day')
      .eq('id', credit_card_id)
      .single()

    if (cardError || !card) {
      throw new Error(`Credit card not found: ${cardError?.message}`)
    }

    const purchaseDate = new Date(transaction_date)
    const installmentAmount = amount / total_installments

    // Generate installments
    const installments = []
    
    for (let i = 0; i < total_installments; i++) {
      const { billingMonth, dueDate } = calculateBillingDates(
        purchaseDate,
        card.closing_day,
        card.due_day,
        i // installment offset in months
      )

      installments.push({
        household_id,
        transaction_id: id,
        credit_card_id,
        installment_number: i + 1,
        total_installments,
        amount: Math.round(installmentAmount * 100) / 100, // Round to 2 decimals
        billing_month: format(billingMonth, 'yyyy-MM-dd'),
        due_date: format(dueDate, 'yyyy-MM-dd'),
        status: 'pending',
      })
    }

    // Insert all installments in batch
    const { data: created, error: insertError } = await supabase
      .from('installments')
      .insert(installments)
      .select()

    if (insertError) {
      throw new Error(`Failed to create installments: ${insertError.message}`)
    }

    // Update transaction with first installment info
    await supabase
      .from('transactions')
      .update({
        installment_number: 1,
        billing_month: installments[0].billing_month,
      })
      .eq('id', id)

    return new Response(
      JSON.stringify({
        message: 'Installments created successfully',
        installments_created: created?.length ?? 0,
        installments: created,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in create-installments:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Calculate billing month and due date for an installment
 * 
 * Algorithm:
 * 1. If purchase is BEFORE closing_day of current month -> bills this month
 * 2. If purchase is ON or AFTER closing_day -> bills next month
 * 3. Add installment offset (months) to billing month
 * 4. Due date is closing_day + (due_day - closing_day) days later
 */
function calculateBillingDates(
  purchaseDate: Date,
  closingDay: number,
  dueDay: number,
  installmentOffset: number
): { billingMonth: Date; dueDate: Date } {
  const purchaseDay = purchaseDate.getDate()
  
  // Determine first billing month
  let billingMonth = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), 1)
  
  // If purchase is on or after closing day, it goes to next month's bill
  if (purchaseDay >= closingDay) {
    billingMonth = addMonths(billingMonth, 1)
  }
  
  // Add installment offset
  billingMonth = addMonths(billingMonth, installmentOffset)
  
  // Calculate due date
  // Handle edge case: if due_day < closing_day, due is next month
  let dueDate: Date
  if (dueDay >= closingDay) {
    // Due date is in the same month as billing
    dueDate = setDate(billingMonth, dueDay)
  } else {
    // Due date is in the month after billing
    dueDate = setDate(addMonths(billingMonth, 1), dueDay)
  }
  
  // Handle months with fewer days (e.g., Feb 30 -> Feb 28)
  const lastDayOfMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate()
  if (dueDay > lastDayOfMonth) {
    dueDate = setDate(dueDate, lastDayOfMonth)
  }
  
  return { billingMonth, dueDate }
}
