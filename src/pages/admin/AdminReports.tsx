import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { AdminTabs } from "../../components/AdminTabs";
import type { Report } from "../../types";

export function AdminReports() {
  const { t } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "reports"),
      where("status", "==", "open"),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(
      q,
      (snap) => {
        setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Report));
      },
      (err) => setError(err.message),
    );
  }, []);

  async function deletePost(postId: string) {
    if (!confirm(t.admin.confirmDeleteReported)) return;
    try {
      await api("/api/admin/delete-post", { body: { postId } });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    }
  }

  return (
    <div>
      <AdminTabs />
      <h1>{t.admin.reportsTitle}</h1>
      {error && <p className="error">{error}</p>}
      {reports.length === 0 && <p>{t.admin.reportsNone}</p>}
      {reports.map((r) => (
        <div className="card" key={r.id}>
          <p>
            <strong>{r.targetType}</strong> <code>{r.targetId}</code>
          </p>
          <p>{r.reason}</p>
          {r.targetType === "post" && (
            <button className="danger" onClick={() => deletePost(r.targetId)}>
              {t.admin.deleteReportedPost}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
