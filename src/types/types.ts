// STUB NEEDED
// TODO [Person 1]:
export interface User {
    id: number;
    email: string;
    display_name: string;
    created_at: Date;
  }
  
  export interface DbUser extends User {
    password_hash: string;
  }
  
  export interface RegisterRequestBody {
    email?: string;
    password?: string;
    display_name?: string;
  }
  
  export interface LoginRequestBody {
    email?: string;
    password?: string;
  }