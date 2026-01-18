import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UsersTable } from '../UsersTable';
import { BrowserRouter } from 'react-router-dom';
import type { Database } from '@/types/database';

// Mock hooks used in UserRowActions
vi.mock('@/admin/hooks/usePermissions', () => ({
  usePermissions: () => ({
    can: () => true,
  }),
}));

vi.mock('@/admin/hooks/useImpersonation', () => ({
  useImpersonation: () => ({
    startImpersonation: { mutateAsync: vi.fn() },
  }),
}));

// Mock types
type HouseholdMember = Database['public']['Tables']['household_members']['Row'] & {
  households?: { name: string };
};

const mockUsers: HouseholdMember[] = [
  {
    id: '1',
    household_id: 'h1',
    user_id: 'u1',
    role: 'owner',
    display_name: 'John Doe',
    avatar_url: null,
    created_at: '2023-01-01T00:00:00Z',
    households: { name: 'Doe Family' },
  },
  {
    id: '2',
    household_id: 'h2',
    user_id: 'u2',
    role: 'member',
    display_name: 'Jane Smith',
    avatar_url: null,
    created_at: '2023-02-01T00:00:00Z',
    households: { name: 'Smith Family' },
  },
];

const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('UsersTable', () => {
  const defaultProps = {
    users: mockUsers,
    selectedUsers: [],
    onSelectUser: vi.fn(),
    onSelectAll: vi.fn(),
    isLoading: false,
  };

  it('renders loading skeleton when isLoading is true', () => {
    renderWithRouter(<UsersTable {...defaultProps} isLoading={true} />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when users array is empty', () => {
    renderWithRouter(<UsersTable {...defaultProps} users={[]} />);
    expect(screen.getByText('Nenhum usuário encontrado com os filtros aplicados.')).toBeInTheDocument();
  });

  it('renders user rows correctly', () => {
    renderWithRouter(<UsersTable {...defaultProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Doe Family')).toBeInTheDocument();
    expect(screen.getByText('Smith Family')).toBeInTheDocument();
    expect(screen.getByText('owner')).toBeInTheDocument();
    expect(screen.getByText('member')).toBeInTheDocument();
  });

  it('calls onSelectUser when a row checkbox is clicked', () => {
    renderWithRouter(<UsersTable {...defaultProps} />);
    // Find all checkboxes with label "Select row"
    const checkboxes = screen.getAllByLabelText('Select row');
    fireEvent.click(checkboxes[0]);
    expect(defaultProps.onSelectUser).toHaveBeenCalledWith('1');
  });

  it('calls onSelectAll when select all checkbox is clicked', () => {
    renderWithRouter(<UsersTable {...defaultProps} />);
    const selectAllCheckbox = screen.getByLabelText('Select all');
    fireEvent.click(selectAllCheckbox);
    expect(defaultProps.onSelectAll).toHaveBeenCalledWith(true);
  });

  it('shows selected state for rows', () => {
    renderWithRouter(<UsersTable {...defaultProps} selectedUsers={['1']} />);
    const checkboxes = screen.getAllByRole('checkbox');
    // Index 1 because 0 is "Select all"
    expect(checkboxes[1]).toBeChecked(); 
    expect(checkboxes[2]).not.toBeChecked(); 
  });
});
