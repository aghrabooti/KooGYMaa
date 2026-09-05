import Link from "next/link";
import { Brand } from "@/components/brand";
import { Icon, type IconName } from "@/components/icon";
import { getLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n/translations";
import { toFaDigits } from "@/lib/fa";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { CountUp, Reveal, Tilt } from "@/components/landing/motion";

const features: Array<{
  icon: IconName;
  number: string;
  titleKey: string;
  descKey: string;
  tone: string;
}> = [
  { icon: "grid", number: "01", titleKey: "landing.feature1Title", descKey: "landing.feature1Desc", tone: "lime" },
  { icon: "clipboard", number: "02", titleKey: "landing.feature2Title", descKey: "landing.feature2Desc", tone: "orange" },
  { icon: "trend", number: "03", titleKey: "landing.feature3Title", descKey: "landing.feature3Desc", tone: "violet" },
];

const disciplines: Array<{ icon: IconName; titleKey: string; descKey: string }> = [
  { icon: "dumbbell", titleKey: "landing.sportStrength", descKey: "landing.sportStrengthDesc" },
  { icon: "flame", titleKey: "landing.sportCondition", descKey: "landing.sportConditionDesc" },
  { icon: "heart", titleKey: "landing.sportFuel", descKey: "landing.sportFuelDesc" },
];

export const dynamic = "force-dynamic";

async function platformStats() {
  // Item 14: honest, live platform numbers instead of invented marketing claims.
  try {
    const { prisma } = await import("@/lib/prisma");
    const [gyms, trainers, members, reviews] = await Promise.all([
      prisma.gym.count({ where: { status: "ACTIVE" } }),
      prisma.trainerProfile.count({ where: { isAvailable: true } }),
      prisma.user.count({ where: { role: "USER", status: "ACTIVE" } }),
      prisma.gymReview.aggregate({ _avg: { score: true }, _count: true }),
    ]);
    return { gyms, trainers, members, rating: reviews._avg.score, ratings: reviews._count };
  } catch {
    return { gyms: 0, trainers: 0, members: 0, rating: null as number | null, ratings: 0 };
  }
}

export default async function Home() {
  const locale = await getLocale();
  const t = createT(locale);
  const stats = await platformStats();
  const fmt = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en");
  const rating =
    stats.rating == null
      ? "—"
      : locale === "fa"
        ? toFaDigits(stats.rating.toFixed(1))
        : stats.rating.toFixed(1);
  const RING_C = 2 * Math.PI * 34;
  const ringOffset = stats.rating == null ? RING_C : RING_C * (1 - stats.rating / 5);
  const roles = [
    { labelKey: "landing.roleOwners", titleKey: "landing.ownersTitle", icon: "bar-chart" as IconName, statValue: stats.gyms, statLabelKey: "landing.statLiveGyms" },
    { labelKey: "landing.roleTrainers", titleKey: "landing.trainersTitle", icon: "users" as IconName, statValue: stats.trainers, statLabelKey: "landing.statLiveTrainers" },
    { labelKey: "landing.roleMembers", titleKey: "landing.membersTitle", icon: "flame" as IconName, statValue: stats.members, statLabelKey: "landing.statLiveMembers" },
  ];
  const ticker = [
    t("landing.ticker1"),
    t("landing.ticker2"),
    t("landing.ticker3"),
    t("landing.ticker4"),
    t("landing.ticker5"),
  ];

  return (
    <main className="landing-page">
      <section className="hero" id="home">
        <div className="hero__orb hero__orb--one" aria-hidden="true" />
        <div className="hero__orb hero__orb--two" aria-hidden="true" />
        <div className="hero__ring" aria-hidden="true" />
        <nav className="site-nav" aria-label="Main navigation">
          <Brand light />
          <div className="site-nav__links">
            <a href="#platform">{t("landing.platform")}</a>
            <a href="#for-you">{t("landing.forYou")}</a>
            <a href="#why-us">{t("landing.whyUs")}</a>
          </div>
          <div className="site-nav__actions">
            <LanguageSwitcher className="landing-language" />
            <ThemeToggle className="landing-theme" />
            <Link className="nav-login" href="/login">{t("landing.logIn")}</Link>
            <Link className="button button--lime button--small button--shine" href="/register">
              {t("landing.getStarted")} <Icon name="arrow" size={16} />
            </Link>
          </div>
        </nav>

        <div className="hero__glow" />
        <div className="hero__grid container">
          <div className="hero__copy">
            <Reveal>
              <div className="eyebrow eyebrow--dark">
                <span className="live-dot" />
                {t("landing.heroEyebrow")}
              </div>
            </Reveal>
            <Reveal delay={90}>
              <h1>
                {t("landing.heroTitle1")}
                <br />
                <span>{t("landing.heroTitle2")}</span>
              </h1>
            </Reveal>
            <Reveal delay={180}>
              <p className="hero__lead">
                {t("landing.heroLead")}
              </p>
            </Reveal>
            <Reveal delay={260}>
              <div className="hero__actions">
                <Link className="button button--lime button--shine" href="/register">
                  {t("landing.heroCta1")} <Icon name="arrow" size={18} />
                </Link>
                <a className="button button--ghost" href="#platform">
                  <span className="play-icon">▶</span> {t("landing.heroCta2")}
                </a>
              </div>
            </Reveal>
            <Reveal delay={340}>
              <div className="hero__proof">
                <div className="avatar-stack" aria-hidden="true">
                  <span>AM</span><span>JR</span><span>KL</span><span>+2k</span>
                </div>
                <div>
                  <div className="hero__stars">★★★★★ <strong>{rating}</strong><small> ({stats.ratings > 0 ? fmt.format(stats.ratings) : "—"} {t("landing.statLiveReviews")})</small></div>
                  <p>{t("authShell.trustedBy")}</p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={200} className="hero__stage-reveal">
            <Tilt className="product-stage" >
              <div aria-label="KooGYMaa dashboard preview">
                <div className="product-stage__mesh" />
                <div className="emblem" role="img" aria-label={t("landing.demoEmblem")}>
                  <span className="emblem__halo" aria-hidden="true" />
                  <span className="emblem__orbit" aria-hidden="true" />
                  <span className="emblem__core"><Icon name="dumbbell" size={36} /></span>
                </div>
                <div className="float-pill float-pill--top">
                  <span><Icon name="flame" size={16} /></span>
                  <div><strong>{t("landing.demoStreak")}</strong><small>{t("landing.demoStreakSub")}</small></div>
                </div>
                <div className="float-pill float-pill--mid">
                  <span><Icon name="users" size={16} /></span>
                  <div><strong><CountUp value={stats.trainers} locale={locale} /></strong><small>{t("landing.demoActiveTrainers")}</small></div>
                </div>
                <div className="product-card">
                  <div className="product-card__dumbbell" aria-hidden="true"><Icon name="dumbbell" size={190} /></div>
                  <div className="product-card__header">
                    <div>
                      <small>{t("landing.demoLive")}</small>
                      <h2>{t("landing.demoGreeting")}</h2>
                    </div>
                    <div className="mini-avatars"><span>KA</span><span>NO</span></div>
                  </div>
                  <div className="mini-stats">
                    <div><span>{t("landing.statLiveMembers")}</span><strong><CountUp value={stats.members} locale={locale} /></strong><small>{t("landing.statLiveNote")}</small></div>
                    <div><span>{t("landing.statLiveGyms")}</span><strong><CountUp value={stats.gyms} locale={locale} /></strong><small>{t("landing.statLiveNote")}</small></div>
                  </div>
                  <div className="rating-panel">
                    <svg className="rating-ring" viewBox="0 0 84 84" role="img" aria-label={t("landing.demoRating")}>
                      <defs>
                        <linearGradient id="ratingGrad" x1="0" x2="1" y1="0" y2="1">
                          <stop offset="0" stopColor="#9ede5a" />
                          <stop offset="1" stopColor="#4d7c0f" />
                        </linearGradient>
                      </defs>
                      <circle className="rating-ring__track" cx="42" cy="42" r="34" />
                      <circle className="rating-ring__fill" cx="42" cy="42" r="34" stroke="url(#ratingGrad)" style={{ strokeDasharray: RING_C, strokeDashoffset: ringOffset }} />
                      <text className="rating-ring__star" x="42" y="50" textAnchor="middle">★</text>
                    </svg>
                    <div>
                      <small>{t("landing.demoRating")}</small>
                      <strong>{rating} <span>/ 5</span></strong>
                      <p>{stats.ratings > 0 ? fmt.format(stats.ratings) : "—"} {t("landing.demoReviews")}</p>
                    </div>
                  </div>
                  <div className="chart-card">
                    <div className="chart-card__heading">
                      <div><small>{t("landing.demoWeek")}</small></div>
                      <span>{t("landing.demoRange")} ▾</span>
                    </div>
                    <svg className="hero-chart" viewBox="0 0 460 145" role="img" aria-label="Weekly activity trending upward">
                      <defs>
                        <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0" stopColor="#c8f169" stopOpacity=".42" />
                          <stop offset="1" stopColor="#c8f169" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path className="chart-gridline" d="M0 25h460M0 70h460M0 115h460" />
                      <path className="chart-area" d="M0 116C35 110 51 94 82 99s50 4 78-17 48-9 76-15 48-39 79-30 42 27 72 5 49-10 73-26V145H0Z" />
                      <path className="chart-line" d="M0 116C35 110 51 94 82 99s50 4 78-17 48-9 76-15 48-39 79-30 42 27 72 5 49-10 73-26" />
                      <circle cx="315" cy="37" r="5" />
                    </svg>
                    <div className="chart-days"><span>{t("landing.dayMon")}</span><span>{t("landing.dayTue")}</span><span>{t("landing.dayWed")}</span><span>{t("landing.dayThu")}</span><span>{t("landing.dayFri")}</span><span>{t("landing.daySat")}</span><span>{t("landing.daySun")}</span></div>
                  </div>
                  <div className="session-strip">
                    <div className="session-strip__icon"><Icon name="dumbbell" /></div>
                    <div><small><span className="live-dot" />{t("landing.demoNext")} · {t("landing.demoNextTime")}</small><strong>{t("landing.demoSession")}</strong></div>
                    <div className="session-strip__people"><span>JD</span><span>+8</span></div>
                  </div>
                </div>
                <div className="float-pill float-pill--bottom">
                  <span><Icon name="check" size={16} /></span>
                  <div><strong>{t("landing.demoDone")}</strong><small>{t("landing.demoDoneSub")}</small></div>
                </div>
              </div>
            </Tilt>
          </Reveal>
        </div>
        <div className="hero__ticker" aria-label="Platform benefits">
          <div className="hero__ticker__track">
            {[false, true].map((hidden) => (
              <div className="hero__ticker__group" aria-hidden={hidden || undefined} key={hidden ? "dup" : "main"}>
                {ticker.map((item) => (
                  <span key={item} className="hero__ticker__item">{item}<b>✦</b></span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grind-section" aria-label="Training disciplines">
        <div className="container">
          <Reveal>
            <div className="grind-section__heading">
              <div className="eyebrow"><Icon name="dumbbell" size={15} /> {t("landing.grindEyebrow")}</div>
              <h2>{t("landing.grindTitle1")}<br /><span>{t("landing.grindTitle2")}</span></h2>
            </div>
          </Reveal>
          <svg className="ecg" viewBox="0 0 600 80" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 40H170l12-20 14 40 13-28 9 8H290l11-16 11 32 11-24 8 8H410l13-22 15 44 13-30 9 8H600" />
          </svg>
          <div className="grind-grid">
            {disciplines.map((item, index) => (
              <Reveal key={item.titleKey} delay={index * 110}>
                <article className="grind-card">
                  <span className="grind-card__watermark" aria-hidden="true"><Icon name={item.icon} size={150} /></span>
                  <span className="grind-card__icon"><Icon name={item.icon} size={24} /></span>
                  <h3>{t(item.titleKey)}</h3>
                  <p>{t(item.descKey)}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="features-section" id="platform">
        <div className="container">
          <div className="section-heading">
            <Reveal>
              <div>
                <div className="eyebrow"><Icon name="bolt" size={15} /> {t("landing.thePlatform")}</div>
                <h2>{t("landing.everythingYourGymNeeds")}<br /><span>{t("landing.nothingItDoesnt")}</span></h2>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <p>{t("landing.purposeBuilt")}</p>
            </Reveal>
          </div>

          <div className="feature-grid">
            {features.map((feature, index) => (
              <Reveal key={feature.titleKey} delay={index * 110}>
                <article className={`feature-card feature-card--${feature.tone}`}>
                  <div className="feature-card__top">
                    <span className="feature-card__icon"><Icon name={feature.icon} size={24} /></span>
                    <small>{feature.number}</small>
                  </div>
                  <h3>{t(feature.titleKey)}</h3>
                  <p>{t(feature.descKey)}</p>
                  <a href="#for-you">{t("landing.explorePlatform")} <Icon name="arrow" size={17} /></a>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="roles-section" id="for-you">
        <div className="container">
          <div className="roles-intro">
            <Reveal>
              <div className="eyebrow eyebrow--dark"><Icon name="sparkles" size={15} /> {t("landing.madeForEveryGoal")}</div>
              <h2>{t("landing.oneSystem")}<br /><span>{t("landing.threeViews")}</span></h2>
            </Reveal>
            <Reveal delay={120}>
              <p>{t("landing.everyoneGets")}</p>
            </Reveal>
          </div>
          <div className="role-grid">
            {roles.map((role, index) => (
              <Reveal key={role.labelKey} delay={index * 110}>
                <article className={`role-card role-card--${index + 1}`}>
                  <div className="role-card__icon"><Icon name={role.icon} size={23} /></div>
                  <small>{t(role.labelKey)}</small>
                  <h3>{t(role.titleKey)}</h3>
                  <div className="role-card__stat"><strong><CountUp value={role.statValue} locale={locale} /></strong><span>{t(role.statLabelKey)}</span></div>
                  <Link href="/register">{t("landing.forYou")} <Icon name="arrow" size={17} /></Link>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="confidence-section" id="why-us">
        <div className="container confidence-grid">
          <Reveal>
            <div>
              <div className="eyebrow"><Icon name="shield" size={15} /> {t("landing.builtForLongRun")}</div>
              <h2>{t("landing.simpleDayOne")}<br /><span>{t("landing.powerfulAfter")}</span></h2>
            </div>
          </Reveal>
          <Reveal delay={130}>
            <div className="confidence-list">
              <div><span><Icon name="check" size={17} /></span><p><strong>{t("landing.fastToStart")}</strong>{t("landing.fastToStartDesc")}</p></div>
              <div><span><Icon name="check" size={17} /></span><p><strong>{t("landing.easyToUse")}</strong>{t("landing.easyToUseDesc")}</p></div>
              <div><span><Icon name="check" size={17} /></span><p><strong>{t("landing.readyToGrow")}</strong>{t("landing.readyToGrowDesc")}</p></div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-orbit cta-orbit--one" /><div className="cta-orbit cta-orbit--two" />
        <div className="cta-section__content">
          <Reveal>
            <div className="eyebrow eyebrow--dark">{t("landing.yourNextRep")}</div>
            <h2>{t("landing.readyToBuild")}<br /><span>{t("landing.somethingStronger")}</span></h2>
            <p>{t("landing.bringYourGym")}</p>
            <Link className="button button--dark button--shine" href="/register">{t("landing.getStartedFree")} <Icon name="arrow" size={18} /></Link>
          </Reveal>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container site-footer__main">
          <Brand light />
          <p>{t("landing.movementManaged")}</p>
          <div><a href="#platform">{t("landing.platform")}</a><a href="#for-you">{t("landing.forYou")}</a><Link href="/gyms">{t("footer.gyms")}</Link><Link href="/trainers">{t("footer.trainers")}</Link><Link href="/about">{t("footer.about")}</Link><Link href="/contact">{t("footer.contact")}</Link><Link href="/help">{t("footer.help")}</Link><Link href="/terms">{t("footer.terms")}</Link><Link href="/privacy">{t("footer.privacy")}</Link><Link href="/login">{t("landing.logIn")}</Link></div>
        </div>
        <div className="site-footer__giant" aria-hidden="true">KooGYMaa</div>
        <div className="container site-footer__bottom"><span>© 2026 KooGYMaa</span><span>{t("landing.madeForPeople")}</span></div>
      </footer>
    </main>
  );
}
