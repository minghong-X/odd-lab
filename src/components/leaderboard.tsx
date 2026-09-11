"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/provider";
import { isErrorCode, numberFormatter } from "@/i18n";
type Entry = {
  id: string;
  title: string;
  matches: number;
  wins: number;
  draws: number;
  rejected: number;
};
export function Leaderboard({ slug }: { slug: string }) {
  const { t, locale } = useI18n();
  const format = numberFormatter(locale);
  const [data, setData] = useState<{
      entries: Entry[];
      totalVotes: number;
    } | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setLoading(true);
    fetch(`/api/leaderboard?experiment=${slug}`, { signal: controller.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.code);
        setData(d);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(isErrorCode(e.message) ? e.message : "load");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug, revision]);
  return (
    <>
      <div className="ranking-summary">
        <div>
          <strong>{data ? format.format(data.totalVotes) : "—"}</strong>
          <span>{t("rank.totalVotes")}</span>
        </div>
        <div>
          <strong>{data ? format.format(data.entries.length) : "—"}</strong>
          <span>{t("rank.entries")}</span>
        </div>
        <p>
          {t("rank.summary1")}
          <br />
          {t("rank.summary2")}
        </p>
        <button
          className="text-link"
          onClick={() => setRevision((r) => r + 1)}
          disabled={loading}
        >
          {loading ? t("common.loading") : t("rank.refresh") + " ↻"}
        </button>
      </div>
      {error ? (
        <div className="empty-state" role="alert">
          <p>{t(`errors.${isErrorCode(error) ? error : "load"}`)}</p>
          <button
            className="button primary"
            onClick={() => setRevision((r) => r + 1)}
          >
            {t("common.reload")}
          </button>
        </div>
      ) : data?.entries.length ? (
        <>
          <div className="table-scroll">
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>{t("rank.position")}</th>
                  <th>{t("rank.model")}</th>
                  <th>{t("rank.matches")}</th>
                  <th>{t("rank.winDraw")}</th>
                  <th>{t("rank.rejected")}</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry, i) => (
                  <tr key={entry.id}>
                    <td>
                      <span
                        className={
                          entry.matches > 0 && i < 3 ? "rank medal" : "rank"
                        }
                      >
                        {entry.matches ? i + 1 : "—"}
                      </span>
                    </td>
                    <td>
                      <div className="rank-model">
                        <img
                          src={`/api/media?id=${entry.id}`}
                          alt=""
                          width="80"
                          height="60"
                        />
                        <div>
                          <strong>{entry.title}</strong>
                          <small>
                            {entry.matches === 0
                              ? t("rank.unrated")
                              : entry.matches < 20
                                ? t("rank.provisional")
                                : t("rank.rated")}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{format.format(entry.matches)}</td>
                    <td>
                      {format.format(entry.wins)} / {format.format(entry.draws)}
                    </td>
                    <td>{format.format(entry.rejected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="ranking-rules">
            <summary>{t("rank.rulesTitle")}</summary>
            <p>{t("rank.rules1")}</p>
            <p>{t("rank.rules2")}</p>
          </details>
        </>
      ) : !loading ? (
        <div className="empty-state">
          <h2>{t("rank.empty")}</h2>
          <Link href="/arena/pelican" className="button primary">
            {t("rank.emptyLink")} ↗
          </Link>
        </div>
      ) : (
        <p className="loading-text">{t("rank.loading")}</p>
      )}
    </>
  );
}
