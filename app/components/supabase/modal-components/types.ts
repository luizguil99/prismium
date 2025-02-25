export interface SupabaseProject {
  id: string;
  name: string;
  ref: string;
}

export interface SupabaseRegion {
  id: string;
  name: string;
}

export interface SupabaseOrganization {
  id: string;
  name: string;
}

export interface OAuthResponse {
  access_token: string;
  refresh_token: string;
  [key: string]: any;
} 