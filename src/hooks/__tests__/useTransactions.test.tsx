import { renderHook, waitFor } from "@testing-library/react";
import {
  useTransactions,
  useTransaction,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from "@/hooks/useTransactions";
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/supabase";
import { useHouseholdId, useSelectedMonth } from "@/stores";
import { vi, describe, it, expect, beforeEach, type Mock } from "vitest";
import type { InsertTables } from "@/types";
// Mock stores
vi.mock("@/stores", () => ({
  useHouseholdId: vi.fn(),
  useSelectedMonth: vi.fn(),
}));

// Mock Supabase functions
vi.mock("@/lib/supabase", async () => {
  const actual = await vi.importActual("@/lib/supabase");
  return {
    ...actual,
    getTransactions: vi.fn(),
    getTransaction: vi.fn(),
    createTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    getRecentTransactions: vi.fn(),
    getTransactionsByCategory: vi.fn(),
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnValue({ data: [], error: null }),
      })),
    },
  };
});

// Mock QueryClient
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useTransactions Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useHouseholdId as unknown as Mock).mockReturnValue("household-123");
    (useSelectedMonth as unknown as Mock).mockReturnValue(
      new Date("2026-01-01")
    );
  });

  describe("useTransactions", () => {
    it("should fetch transactions list", async () => {
      const mockTransactions = [{ id: "1", description: "Test", amount: 100 }];
      (getTransactions as unknown as Mock).mockResolvedValue(mockTransactions);

      const { result } = renderHook(() => useTransactions(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTransactions);
      expect(getTransactions).toHaveBeenCalledWith(
        "household-123",
        expect.objectContaining({
          month: expect.any(Date),
        })
      );
    });
  });

  describe("useTransaction", () => {
    it("should fetch single transaction details", async () => {
      const mockTransaction = { id: "1", description: "Test", amount: 100 };
      (getTransaction as unknown as Mock).mockResolvedValue(mockTransaction);

      const { result } = renderHook(() => useTransaction("1"), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTransaction);
      expect(getTransaction).toHaveBeenCalledWith("1");
    });
  });

  describe("useCreateTransaction", () => {
    it("should create a transaction successfully", async () => {
      const newTransaction = {
        description: "New",
        amount: 50,
        date: "2026-01-01",
      };
      (createTransaction as unknown as Mock).mockResolvedValue({
        id: "new-1",
        ...newTransaction,
      });

      const { result } = renderHook(() => useCreateTransaction(), { wrapper });

      await result.current.mutateAsync(
        newTransaction as unknown as Omit<
          InsertTables<"transactions">,
          "household_id"
        >
      ); // Type assertion needed for partial mock

      expect(createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newTransaction,
          household_id: "household-123",
        })
      );
    });
  });

  describe("useUpdateTransaction", () => {
    it("should update a transaction successfully", async () => {
      const updateData = { description: "Updated" };
      (updateTransaction as unknown as Mock).mockResolvedValue({
        id: "1",
        ...updateData,
      });

      const { result } = renderHook(() => useUpdateTransaction(), { wrapper });

      await result.current.mutateAsync({ id: "1", data: updateData });

      expect(updateTransaction).toHaveBeenCalledWith("1", updateData);
    });
  });

  describe("useDeleteTransaction", () => {
    it("should delete a transaction successfully", async () => {
      (deleteTransaction as unknown as Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useDeleteTransaction(), { wrapper });

      await result.current.mutateAsync("1");

      expect(deleteTransaction).toHaveBeenCalledWith("1");
    });
  });
});
