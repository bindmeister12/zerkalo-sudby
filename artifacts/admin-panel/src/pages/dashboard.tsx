import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/App";
import { useLocation } from "wouter";

interface Stats {
  totalUsers: number;
  premiumUsers: number;
  subscriptionsEnabled: boolean;
}

interface AdminUser {
  id: number;
  email: string | null;
  displayName: string | null;
  isPremium: boolean;
  premiumGrantedAt: string | null;
  createdAt: string;
  vkLinked: boolean;
}

function useAdminFetch() {
  const { token, setToken } = useAuth();
  const [, navigate] = useLocation();

  return useCallback(async function apiFetch(url: string, options?: RequestInit) {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });
    if (res.status === 401 || res.status === 403) {
      setToken(null);
      navigate("/login");
      throw new Error("Unauthorized");
    }
    return res;
  }, [token, setToken, navigate]);
}

export default function DashboardPage() {
  const { setToken } = useAuth();
  const [, navigate] = useLocation();
  const apiFetch = useAdminFetch();

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [statsLoading, setStatsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [togglingSubscriptions, setTogglingSubscriptions] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function fetchStats() {
    try {
      const res = await apiFetch("/api/admin/stats");
      const data = await res.json() as Stats;
      setStats(data);
    } catch {
    } finally {
      setStatsLoading(false);
    }
  }

  async function fetchUsers(q?: string) {
    setUsersLoading(true);
    try {
      const qs = q ? `?search=${encodeURIComponent(q)}` : "";
      const res = await apiFetch(`/api/admin/users${qs}`);
      const data = await res.json() as { users: AdminUser[] };
      setUsers(data.users);
    } catch {
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(search || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function toggleSubscriptions() {
    if (!stats) return;
    setTogglingSubscriptions(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ subscriptionsEnabled: !stats.subscriptionsEnabled }),
      });
      if (!res.ok) {
        setError("Не удалось изменить настройку");
        return;
      }
      setStats((s) => s ? { ...s, subscriptionsEnabled: !s.subscriptionsEnabled } : s);
    } catch {
      setError("Ошибка соединения");
    } finally {
      setTogglingSubscriptions(false);
    }
  }

  async function togglePremium(user: AdminUser) {
    setTogglingUserId(user.id);
    setError("");
    try {
      const res = await apiFetch(`/api/admin/users/${user.id}/premium`, {
        method: "PATCH",
        body: JSON.stringify({ isPremium: !user.isPremium }),
      });
      if (!res.ok) {
        setError("Не удалось изменить статус");
        return;
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isPremium: !u.isPremium, premiumGrantedAt: !u.isPremium ? new Date().toISOString() : null } : u
        )
      );
      fetchStats();
    } catch {
      setError("Ошибка соединения");
    } finally {
      setTogglingUserId(null);
    }
  }

  function signOut() {
    setToken(null);
    navigate("/login");
  }

  function formatDate(s: string) {
    return new Date(s).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔮</span>
          <div>
            <h1 className="font-bold text-foreground text-lg leading-none">Зеркало Судьбы</h1>
            <p className="text-muted-foreground text-xs mt-0.5">Панель администратора</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Выйти
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">Всего пользователей</p>
            <p className="text-3xl font-bold text-foreground">
              {statsLoading ? "—" : stats?.totalUsers ?? 0}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">Премиум пользователей</p>
            <p className="text-3xl font-bold text-primary">
              {statsLoading ? "—" : stats?.premiumUsers ?? 0}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">Бесплатных</p>
            <p className="text-3xl font-bold text-foreground">
              {statsLoading ? "—" : (stats ? stats.totalUsers - stats.premiumUsers : 0)}
            </p>
          </div>
        </div>

        {/* Subscriptions toggle */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="font-semibold text-foreground text-base">Платные подписки</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {stats?.subscriptionsEnabled
                  ? "Включены — пользователи видят пейволл после 1 бесплатного сканирования"
                  : "Отключены — все пользователи имеют полный бесплатный доступ"}
              </p>
              {!stats?.subscriptionsEnabled && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Включите подписки только после подключения RuStore и регистрации ИП
                </p>
              )}
            </div>
            <button
              onClick={toggleSubscriptions}
              disabled={togglingSubscriptions || statsLoading}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card disabled:opacity-50 flex-shrink-0 mt-0.5 ${
                stats?.subscriptionsEnabled ? "bg-primary" : "bg-muted"
              }`}
              aria-label="Переключить подписки"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                  stats?.subscriptionsEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full ${
              stats?.subscriptionsEnabled
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${stats?.subscriptionsEnabled ? "bg-primary" : "bg-muted-foreground"}`} />
              {stats?.subscriptionsEnabled ? "Подписки включены" : "Подписки отключены"}
            </span>
            {togglingSubscriptions && (
              <span className="text-xs text-muted-foreground">Сохраняем...</span>
            )}
          </div>
        </div>

        {/* Users table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-semibold text-foreground">Пользователи</h2>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по email или имени..."
              className="px-3 py-1.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm w-60"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Пользователь</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Метод входа</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Дата регистрации</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Премиум</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-muted-foreground">
                      Загрузка...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-muted-foreground">
                      {search ? "Пользователи не найдены" : "Нет пользователей"}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {user.displayName || <span className="text-muted-foreground italic">Без имени</span>}
                          </p>
                          <p className="text-muted-foreground text-xs mt-0.5">{user.email ?? "—"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          user.vkLinked
                            ? "bg-blue-500/15 text-blue-400"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {user.vkLinked ? "ВКонтакте" : "Email"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => togglePremium(user)}
                          disabled={togglingUserId === user.id}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all disabled:opacity-50 ${
                            user.isPremium
                              ? "bg-primary/15 text-primary hover:bg-destructive/15 hover:text-destructive"
                              : "bg-muted text-muted-foreground hover:bg-primary/15 hover:text-primary"
                          }`}
                          title={user.isPremium
                            ? (user.premiumGrantedAt ? `Выдан ${formatDate(user.premiumGrantedAt)}` : "Отозвать")
                            : "Выдать премиум"}
                        >
                          {togglingUserId === user.id
                            ? "..."
                            : user.isPremium
                            ? "✦ Премиум"
                            : "Бесплатный"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {users.length > 0 && (
            <div className="px-6 py-3 border-t border-border text-xs text-muted-foreground">
              Показано {users.length} пользователей
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
