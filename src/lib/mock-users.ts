import { hashPassword } from "./auth-utils";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "OPERATOR" | "VIEWER";
  passwordHash: string; // Stored as salt:hash
}

// Global reference to persist users across serverless reload simulation
const globalForMockUsers = globalThis as unknown as {
  mockUsers: UserProfile[] | undefined;
};

// Seed initial system mock users (passwords are: adminpassword123, operatorpassword123, viewerpassword123)
export const mockUsers: UserProfile[] = globalForMockUsers.mockUsers ?? [
  {
    id: "usr-mock-admin",
    email: "admin@orbital.command",
    name: "Flight Director (Admin)",
    role: "ADMIN",
    passwordHash: hashPassword("adminpassword123"),
  },
  {
    id: "usr-mock-operator",
    email: "operator@orbital.command",
    name: "Flight Controller (Operator)",
    role: "OPERATOR",
    passwordHash: hashPassword("operatorpassword123"),
  },
  {
    id: "usr-mock-viewer",
    email: "viewer@orbital.command",
    name: "Mission Observer (Viewer)",
    role: "VIEWER",
    passwordHash: hashPassword("viewerpassword123"),
  },
];

if (process.env.NODE_ENV !== "production") {
  globalForMockUsers.mockUsers = mockUsers;
}

export function findMockUserByEmail(email: string): UserProfile | null {
  return mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function addMockUser(user: UserProfile): void {
  if (!mockUsers.find((u) => u.email.toLowerCase() === user.email.toLowerCase())) {
    mockUsers.push(user);
  }
}
