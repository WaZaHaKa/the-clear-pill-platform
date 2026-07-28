import { EnergyLevel, MissionStatus } from "@clearpill/db";
import {
  dateKeyForTimeZone,
  getDefaultPilotContext,
  getTodayDashboard,
} from "@clearpill/planning-service";
import {
  generateTodayAction,
  missionStatusAction,
  saveCheckInAction,
  saveReflectionAction,
} from "../actions";

export const dynamic = "force-dynamic";

function statusLabel(status: MissionStatus): string {
  const labels: Record<MissionStatus, string> = {
    PLANNED: "מתוכנן",
    IN_PROGRESS: "בתהליך",
    DONE: "הושלם",
    SKIPPED: "דולג",
    RESCHEDULED: "הועבר",
  };
  return labels[status];
}

export default async function TodayPage() {
  if (process.env.DEMO_MODE !== "true") {
    return (
      <section className="emptyState">
        <p className="eyebrow">גישה מוגנת</p>
        <h1>הפיילוט אינו פתוח ללא מערכת הזדהות</h1>
        <p>הפעלת ממשק ציבורי דורשת תחילה אימות משתמש והרשאות סביבת עבודה.</p>
      </section>
    );
  }

  const context = await getDefaultPilotContext();
  if (!context) {
    return (
      <section className="emptyState">
        <p className="eyebrow">התחלה בטוחה</p>
        <h1>מסד הנתונים עדיין לא אותחל</h1>
        <p>הפעל את זריעת נתוני הפיילוט ולאחר מכן רענן את הדף.</p>
      </section>
    );
  }

  const dateKey = dateKeyForTimeZone(new Date(), context.timezone);
  const dashboard = await getTodayDashboard({
    workspaceId: context.workspaceId,
    userId: context.userId,
    dateKey,
  });
  const completed = dashboard.missions.filter((mission) => mission.status === MissionStatus.DONE).length;
  const plannedMinutes = dashboard.missions.reduce((sum, mission) => sum + mission.plannedMinutes, 0);
  const defaultCapacity = dashboard.checkIn?.capacityMinutes ?? dashboard.workspace?.dailyCapacityMinutes ?? 180;
  const defaultEnergy = dashboard.checkIn?.energy ?? EnergyLevel.MEDIUM;

  return (
    <>
      <section className="hero compact">
        <p className="eyebrow">{dateKey} · {dashboard.workspace?.timezone}</p>
        <h1>שלום {dashboard.user?.displayName ?? context.displayName}, מה באמת חשוב היום?</h1>
        <p className="lede">
          היום בנוי ממשימות שמחוברות ליעד שנתי ולחזון חמש השנים. אין צורך לבחור מחדש מכל העסק בכל בוקר.
        </p>
        <div className="summaryStrip" aria-label="סיכום היום">
          <span><strong>{dashboard.missions.length}</strong> משימות</span>
          <span><strong>{plannedMinutes}</strong> דקות</span>
          <span><strong>{completed}</strong> הושלמו</span>
        </div>
      </section>

      <details className="panel checkInPanel" open={!dashboard.checkIn}>
        <summary>בדיקת בוקר: כמה באמת אפשר היום?</summary>
        <form action={saveCheckInAction} className="formGrid">
          <label>
            דקות זמינות
            <input
              min="0"
              max="960"
              name="capacityMinutes"
              type="number"
              defaultValue={defaultCapacity}
              required
            />
          </label>
          <label>
            רמת אנרגיה
            <select name="energy" defaultValue={defaultEnergy}>
              <option value={EnergyLevel.LOW}>נמוכה</option>
              <option value={EnergyLevel.MEDIUM}>בינונית</option>
              <option value={EnergyLevel.HIGH}>גבוהה</option>
            </select>
          </label>
          <label className="fullField">
            מיקוד אחד להיום
            <input name="focusText" defaultValue={dashboard.checkIn?.focusText ?? ""} />
          </label>
          <label className="fullField">
            אילוצים שצריך לכבד
            <textarea name="constraints" rows={2} defaultValue={dashboard.checkIn?.constraints ?? ""} />
          </label>
          <div className="fullField buttonRow">
            <button className="primaryButton" type="submit">שמור קיבולת</button>
            {dashboard.missions.length > 0 && (
              <span className="formHint">שינוי לאחר יצירת המשימות לא משכתב אותן אוטומטית.</span>
            )}
          </div>
        </form>
      </details>

      {dashboard.missions.length === 0 ? (
        <section className="panel centered">
          <p className="eyebrow">אין עומס מלאכותי</p>
          <h2>עדיין לא נבחרו משימות להיום</h2>
          <p>המחולל יבחר עד שלוש משימות לפי השפעה, התאמה לחזון, דחיפות, אנרגיה וקיבולת.</p>
          <form action={generateTodayAction}>
            <button className="primaryButton" type="submit">צור את משימות היום</button>
          </form>
        </section>
      ) : (
        <section className="missionGrid" aria-label="משימות היום">
          {dashboard.missions.map((mission, index) => (
            <article className={`missionCard ${index === 0 ? "primaryMission" : ""}`} key={mission.id}>
              <div className="missionHeader">
                <span className="sequence">{index === 0 ? "המשימה המרכזית" : `משימת תמיכה ${index}`}</span>
                <span className={`status status-${mission.status.toLowerCase()}`}>{statusLabel(mission.status)}</span>
              </div>
              <h2>{mission.titleSnapshot}</h2>
              <p className="path">{mission.objectivePath}</p>
              <p className="reason"><strong>למה היום:</strong> {mission.reason}</p>
              <div className="missionMeta">
                <span>{mission.plannedMinutes} דקות</span>
                <span>ציון {Math.round(mission.score)}</span>
              </div>
              {mission.status !== MissionStatus.DONE && (
                <form action={missionStatusAction} className="missionActions">
                  <input type="hidden" name="missionId" value={mission.id} />
                  <textarea
                    aria-label="הוכחה או הערה קצרה"
                    name="evidence"
                    placeholder="הוכחה או סיבה קצרה"
                    rows={2}
                  />
                  <div className="buttonRow">
                    <button name="status" value={MissionStatus.IN_PROGRESS} type="submit">התחלתי</button>
                    <button className="primaryButton" name="status" value={MissionStatus.DONE} type="submit">הושלם</button>
                    <button className="quietButton" name="status" value={MissionStatus.SKIPPED} type="submit">דלג עם סיבה</button>
                  </div>
                </form>
              )}
            </article>
          ))}
        </section>
      )}

      <details className="panel reflectionPanel" open={completed === dashboard.missions.length && completed > 0}>
        <summary>סגירת יום בשלוש דקות</summary>
        <form action={saveReflectionAction} className="formGrid">
          <label className="fullField">
            מה התקדם היום?
            <textarea name="wins" rows={2} defaultValue={dashboard.reflection?.wins ?? ""} />
          </label>
          <label className="fullField">
            מה חסם אותי?
            <textarea name="blockers" rows={2} defaultValue={dashboard.reflection?.blockers ?? ""} />
          </label>
          <label className="fullField">
            מה למדתי?
            <textarea name="lesson" rows={2} defaultValue={dashboard.reflection?.lesson ?? ""} />
          </label>
          <label className="fullField">
            מה חשוב לזכור למחר?
            <textarea name="tomorrowNote" rows={2} defaultValue={dashboard.reflection?.tomorrowNote ?? ""} />
          </label>
          <div className="fullField">
            <button className="primaryButton" type="submit">שמור סיכום יום</button>
          </div>
        </form>
      </details>

      <section className="panel notePanel">
        <h2>כלל המערכת</h2>
        <p>
          AI רשאי להציע ניסוח ופירוק, אך אינו משנה חזון או יעד מאושר בשקט. כל משימה נשמרת עם מסלול אסטרטגי, גרסת אלגוריתם ואירועי ביצוע.
        </p>
      </section>
    </>
  );
}
