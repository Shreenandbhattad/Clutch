import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://owcdpkgjikgistfsyqae.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Y2Rwa2dqaWtnaXN0ZnN5cWFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzgxOTEsImV4cCI6MjA5MjAxNDE5MX0._ziQ_2gFG7qwZXRFSr-nmGZNqrJSW1IFd8RvnLwm6AY"
);
