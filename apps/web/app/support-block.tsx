function ComingSoon() {
  return (
    <button type="button" className="supportCta" disabled aria-disabled="true">
      <span lang="en" dir="ltr">
        Coming soon
      </span>
    </button>
  );
}

export function EnglishSupport() {
  return (
    <>
      <h2 id="support-heading" className="supportName">Support WZHK by TSNO</h2>
      <p className="lede">Everything on WZHK is free, and it stays free whether or not you give.</p>
      <p>If you&apos;d like to support the work, you can send a voluntary gift.</p>
      <section className="panel supportPanel">
        <h3>Please read before you give:</h3>
        <ul className="supportList">
          <li>
            Your gift goes to <strong>Albert Shovtyuk</strong>, the creator of WZHK, personally. TSNO is
            the name of Albert&apos;s personal project, not a company or a registered organisation.
          </li>
          <li>
            A gift <strong>doesn&apos;t buy anything</strong>: no service, content, perks, priority or access.
            Nothing on WZHK depends on whether you give.
          </li>
        </ul>
        <ComingSoon />
        <p className="supportThanks">Thank you.</p>
      </section>
    </>
  );
}

export function HebrewSupport() {
  return (
    <>
      <h2 id="support-heading" className="supportName supportTitleEn" lang="en" dir="ltr">
        Support WZHK by TSNO
      </h2>
      <p className="supportSubtitle">תמיכה ב-WZHK</p>
      <p className="lede">כל התוכן ב-WZHK חינמי, והוא יישאר חינמי בין אם תתמכו ובין אם לא.</p>
      <p>אם תרצו לתמוך בעבודה, אפשר לשלוח מתנה מרצון.</p>
      <section className="panel supportPanel">
        <h3>חשוב לקרוא לפני שנותנים:</h3>
        <ul className="supportList">
          <li>
            המתנה שלכם מגיעה ל<strong>אלברט שובטיוק</strong>, היוצר של WZHK, באופן אישי. TSNO הוא שם
            הפרויקט האישי של אלברט, ואינו חברה או ארגון רשום.
          </li>
          <li>
            המתנה <strong>אינה רוכשת דבר</strong>: לא שירות, לא תוכן, לא הטבות, לא עדיפות ולא גישה. שום
            דבר ב-WZHK אינו תלוי בכך שתתמכו.
          </li>
        </ul>
        <ComingSoon />
        <p className="supportThanks">תודה.</p>
      </section>
    </>
  );
}
