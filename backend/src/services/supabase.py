from supabase import Client, create_client

from src.config import settings

_supabase_admin: Client | None = None


def get_supabase_admin() -> Client | None:
    global _supabase_admin
    if _supabase_admin is None and settings.supabase_url and settings.supabase_service_role_key:
        _supabase_admin = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _supabase_admin
