import {
  ObjectiveStatus,
  PlanHorizon,
  PlanStatus,
  WorkItemStatus,
  db,
} from "@clearpill/db";
import { getDefaultPilotContext } from "@clearpill/planning-service";

export const dynamic = "force-dynamic";

const horizonLabels: Record<PlanHorizon, string> = {
  FIVE_YEAR: "חזון חמש שנים",
  YEAR: "תכנית שנתית",
  QUARTER: "רבעון",
  MONTH: "חודש",
  WEEK: "שבוע",
};

export default async function PlanPage() {
  if (process.env.DEMO_MODE !== "true") {
    return (
      <section className="emptyState">
        <p className="eyebrow">גישה מוגנת</p>
        <h1>התכנית אינה חשופה ללא מערכת הזדהות</h1>
      </section>
    );
  }

  const context = await getDefaultPilotContext();
  if (!context) return <section className="emptyState"><h1>יש לאתחל את סביבת הפיילוט</h1></section>;

  const plans = await db.plan.findMany({
    where: { workspaceId: context.workspaceId, status: PlanStatus.ACTIVE },
    orderBy: [{ startDateKey: "asc" }, { createdAt: "asc" }],
    include: {
      objectives: {
        where: { status: { in: [ObjectiveStatus.ACTIVE, ObjectiveStatus.AT_RISK] } },
        orderBy: { priority: "desc" },
        include: {
          workItems: {
            where: { status: { notIn: [WorkItemStatus.CANCELLED] } },
            orderBy: [{ status: "asc" }, { dueDateKey: "asc" }],
          },
        },
      },
    },
  });

  return (
    <>
      <section className="hero compact">
        <p className="eyebrow">מחשבה לטווח ארוך, פעולה בגודל אנושי</p>
        <h1>המסלול מהחזון למשימה</h1>
        <p className="lede">כל שכבה מסבירה למה השכבה שמתחתיה קיימת. משימה ללא יעד היא חריגה שדורשת הסבר.</p>
      </section>
      <section className="timeline">
        {plans.map((plan) => (
          <article className="planCard" key={plan.id}>
            <div className="planHeading">
              <span className="horizon">{horizonLabels[plan.horizon]}</span>
              <span>{plan.startDateKey}–{plan.endDateKey}</span>
            </div>
            <h2>{plan.title}</h2>
            <p>{plan.narrative}</p>
            <div className="objectiveList">
              {plan.objectives.map((objective) => {
                const done = objective.workItems.filter((item) => item.status === WorkItemStatus.DONE).length;
                return (
                  <section className="objective" key={objective.id}>
                    <div>
                      <h3>{objective.title}</h3>
                      <p>{objective.description}</p>
                    </div>
                    <div className="metric">
                      <strong>{done}/{objective.workItems.length}</strong>
                      <span>פעולות הושלמו</span>
                    </div>
                    <ul>
                      {objective.workItems.map((item) => (
                        <li key={item.id}>
                          <span>{item.title}</span>
                          <small>{item.status} · {item.estimatedMinutes} דק׳</small>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
