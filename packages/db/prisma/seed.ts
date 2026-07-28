import {
  EnergyLevel,
  MemberRole,
  ObjectiveStatus,
  PlanHorizon,
  PlanStatus,
  PrismaClient,
  WorkItemStatus,
} from "@prisma/client";

const db = new PrismaClient();

async function main(): Promise<void> {
  const workspace = await db.workspace.upsert({
    where: { slug: "yaffa-pilot" },
    update: {
      name: "The Clear Pill — Yafa Pilot",
      timezone: "Asia/Jerusalem",
      missionGenerationMinute: 8 * 60,
      dailyCapacityMinutes: 180,
      maxDailyMissions: 3,
      isActive: true,
    },
    create: {
      slug: "yaffa-pilot",
      name: "The Clear Pill — Yafa Pilot",
      timezone: "Asia/Jerusalem",
      missionGenerationMinute: 8 * 60,
      dailyCapacityMinutes: 180,
      maxDailyMissions: 3,
    },
  });

  const user = await db.user.upsert({
    where: { email: "yafa@example.invalid" },
    update: { displayName: "יפה", locale: "he-IL" },
    create: {
      email: "yafa@example.invalid",
      displayName: "יפה",
      locale: "he-IL",
    },
  });

  await db.workspaceMember.upsert({
    where: {
      workspaceId_userId: { workspaceId: workspace.id, userId: user.id },
    },
    update: { role: MemberRole.OWNER, isActive: true },
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: MemberRole.OWNER,
    },
  });

  const fiveYearPlan = await db.plan.findFirst({
    where: {
      workspaceId: workspace.id,
      horizon: PlanHorizon.FIVE_YEAR,
      status: PlanStatus.ACTIVE,
    },
  });

  const vision =
    fiveYearPlan ??
    (await db.plan.create({
      data: {
        workspaceId: workspace.id,
        horizon: PlanHorizon.FIVE_YEAR,
        title: "חזון חמש השנים 2026–2031",
        narrative:
          "לבנות מערכת יציבה שמתרגמת ידע, יצירה ושליחות למוצרים נגישים, הכנסה חוזרת ושינוי אמיתי שנשאר.",
        startDateKey: "2026-07-01",
        endDateKey: "2031-06-30",
        status: PlanStatus.ACTIVE,
      },
    }));

  const annualPlan =
    (await db.plan.findFirst({
      where: {
        workspaceId: workspace.id,
        parentPlanId: vision.id,
        horizon: PlanHorizon.YEAR,
        status: PlanStatus.ACTIVE,
      },
    })) ??
    (await db.plan.create({
      data: {
        workspaceId: workspace.id,
        parentPlanId: vision.id,
        horizon: PlanHorizon.YEAR,
        title: "שנת התשתית והמכירות 2026–2027",
        narrative:
          "להוכיח משפך מכירה אחד, ליצור שגרת ניהול יומית רגועה, ולבנות מערכת מדידה שמאפשרת להרחיב רק את מה שעובד.",
        startDateKey: "2026-07-01",
        endDateKey: "2027-06-30",
        status: PlanStatus.ACTIVE,
      },
    }));

  const objectiveDefinitions = [
    {
      key: "growth-engine",
      title: "להפעיל משפך אחד שחוזר על עצמו",
      description:
        "אתגר ‘שינוי שנשאר’ מוביל לסדנה חודשית, תכנית קבוצתית וליווי המשך.",
      priority: 100,
      targetDateKey: "2026-10-31",
      metricName: "לקוחות משלמים בחודש",
      metricTarget: 20,
    },
    {
      key: "daily-system",
      title: "להטמיע מערכת תכנון ומשימות יומיות",
      description:
        "כל משימה יומית מחוברת ליעד שנתי ולחזון, עם קיבולת, הסבר, מעקב ורפלקציה.",
      priority: 95,
      targetDateKey: "2026-09-15",
      metricName: "ימים עם תכנון וביצוע",
      metricTarget: 25,
    },
    {
      key: "custom-songs",
      title: "לבדוק פיילוט שירים אישיים",
      description:
        "למכור מספר קטן של הזמנות, לתעד תגובות בהסכמה ולבדוק ביקוש לפני הרחבה.",
      priority: 75,
      targetDateKey: "2026-11-30",
      metricName: "הזמנות פיילוט",
      metricTarget: 10,
    },
  ] as const;

  const objectives = new Map<string, string>();
  for (const definition of objectiveDefinitions) {
    const existing = await db.objective.findFirst({
      where: {
        workspaceId: workspace.id,
        planId: annualPlan.id,
        title: definition.title,
      },
    });
    const objective =
      existing ??
      (await db.objective.create({
        data: {
          workspaceId: workspace.id,
          planId: annualPlan.id,
          title: definition.title,
          description: definition.description,
          status: ObjectiveStatus.ACTIVE,
          priority: definition.priority,
          targetDateKey: definition.targetDateKey,
          metricName: definition.metricName,
          metricTarget: definition.metricTarget,
        },
      }));
    objectives.set(definition.key, objective.id);
  }

  const workItems = [
    {
      objectiveKey: "growth-engine",
      title: "לנסח הבטחה אחת ברורה לאתגר ‘שינוי שנשאר’",
      description: "ניסוח קצר: למי, איזה שינוי, ובאיזה פרק זמן.",
      estimatedMinutes: 45,
      impact: 5,
      urgency: 5,
      strategicFit: 5,
      revenueImpact: 5,
      dependencyUnlock: 5,
      confidence: 4,
      requiredEnergy: EnergyLevel.HIGH,
      dueDateKey: "2026-08-02",
    },
    {
      objectiveKey: "growth-engine",
      title: "לבחור תאריך ומחיר לסדנה החודשית הראשונה",
      description: "החלטה אחת שניתנת לפרסום, לא רשימת אפשרויות.",
      estimatedMinutes: 30,
      impact: 5,
      urgency: 4,
      strategicFit: 5,
      revenueImpact: 5,
      dependencyUnlock: 4,
      confidence: 5,
      requiredEnergy: EnergyLevel.MEDIUM,
      dueDateKey: "2026-08-03",
    },
    {
      objectiveKey: "daily-system",
      title: "להגדיר קיבולת יומית ריאלית לשלושה סוגי ימים",
      description: "יום חלש, יום רגיל ויום חזק — בדקות ולא בתחושות בלבד.",
      estimatedMinutes: 25,
      impact: 4,
      urgency: 4,
      strategicFit: 5,
      revenueImpact: 2,
      dependencyUnlock: 5,
      confidence: 5,
      requiredEnergy: EnergyLevel.LOW,
      dueDateKey: "2026-07-30",
    },
    {
      objectiveKey: "daily-system",
      title: "לנסח טקס סיום יום של שלוש דקות",
      description: "מה הושלם, מה נחסם, ומה עובר למחר עם סיבה.",
      estimatedMinutes: 20,
      impact: 4,
      urgency: 3,
      strategicFit: 5,
      revenueImpact: 1,
      dependencyUnlock: 3,
      confidence: 5,
      requiredEnergy: EnergyLevel.LOW,
      dueDateKey: "2026-08-01",
    },
    {
      objectiveKey: "custom-songs",
      title: "להגדיר חבילת פיילוט לשיר אישי",
      description: "מחיר, זמן אספקה, מספר תיקונים ומה הלקוח מקבל.",
      estimatedMinutes: 50,
      impact: 4,
      urgency: 2,
      strategicFit: 4,
      revenueImpact: 4,
      dependencyUnlock: 4,
      confidence: 3,
      requiredEnergy: EnergyLevel.MEDIUM,
      dueDateKey: "2026-08-10",
    },
  ] as const;

  for (const item of workItems) {
    const objectiveId = objectives.get(item.objectiveKey);
    if (!objectiveId) throw new Error(`Missing objective ${item.objectiveKey}`);

    const existing = await db.workItem.findFirst({
      where: { workspaceId: workspace.id, objectiveId, title: item.title },
    });
    if (!existing) {
      await db.workItem.create({
        data: {
          workspaceId: workspace.id,
          objectiveId,
          ownerId: user.id,
          title: item.title,
          description: item.description,
          status: WorkItemStatus.READY,
          estimatedMinutes: item.estimatedMinutes,
          impact: item.impact,
          urgency: item.urgency,
          strategicFit: item.strategicFit,
          revenueImpact: item.revenueImpact,
          dependencyUnlock: item.dependencyUnlock,
          confidence: item.confidence,
          requiredEnergy: item.requiredEnergy,
          dueDateKey: item.dueDateKey,
        },
      });
    }
  }

  console.log(
    JSON.stringify({
      event: "seed_complete",
      workspaceId: workspace.id,
      userId: user.id,
      fiveYearPlanId: vision.id,
      annualPlanId: annualPlan.id,
    }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
