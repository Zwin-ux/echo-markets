-- Enable Realtime for key tables
-- Run each statement in the Supabase SQL editor or use the UI (Database -> Replication -> Publications)

-- Create publication if it doesn't exist
create publication if not exists supabase_realtime for table 
  public.orders,
  public.trades,
  public.ticks,
  public.leaderboards,
  public.events,
  public.narratives;
