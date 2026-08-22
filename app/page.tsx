import Link from "next/link";
import { Brand } from "@/components/brand";
import { Icon, type IconName } from "@/components/icon";
import { getLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n/translations";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

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

const roles = [
  { labelKey: "landing.roleOwners", titleKey: "landing.ownersTitle", icon: "bar-chart" as IconName, stat: "24h", statLabelKey: "landing.statSavedMonth" },
  { labelKey: "landing.roleTrainers", titleKey: "landing.trainersTitle", icon: "users" as IconName, stat: "3.2×", statLabelKey: "landing.statFasterPlans" },
  { labelKey: "landing.roleMembers", titleKey: "landing.membersTitle", icon: "flame" as IconName, stat: "82%", statLabelKey: "landing.statStayOnTrack" },
];

export default async function Home() {
  const t = createT(await getLocale());

  return (
    <main className="landing-page">
      <section className="hero" id="home">
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
            <Link className="button button--lime button--small" href="/register">
              {t("landing.getStarted")} <Icon name="arrow" size={16} />
            </Link>
          </div>
        </nav>

        <div className="hero__glow" />
        <div className="hero__grid container">
          <div className="hero__copy">
            <div className="eyebrow eyebrow--dark">
              <span className="live-dot" />
              {t("landing.heroEyebrow")}
            </div>
            <h1>
              {t("landing.heroTitle1")}
              <br />
              <span>{t("landing.heroTitle2")}</span>
            </h1>
            <p className="hero__lead">
              {t("landing.heroLead")}
            </p>
            <div className="hero__actions">
              <Link className="button button--lime" href="/register">
                {t("landing.heroCta1")} <Icon name="arrow" size={18} />
              </Link>
              <a className="button button--ghost" href="#platform">
                <span className="play-icon">▶</span> {t("landing.heroCta2")}
              </a>
            </div>
            <div className="hero__proof">
              <div className="avatar-stack" aria-hidden="true">
                <span>AM</span><span>JR</span><span>KL</span><span>+2k</span>
              </div>
              <div>
                <div className="hero__stars">★★★★★ <strong>4.9</strong></div>
                <p>{t("authShell.trustedBy")}</p>
              </div>
            </div>
          </div>

          <div className="product-stage" aria-label="KooGYMaa dashboard preview">
            <div className="product-stage__mesh" />
            <div className="float-pill float-pill--top">
              <span><Icon name="bolt" size={16} /></span>
              <div><strong>12 day streak</strong><small>Personal best</small></div>
            </div>
            <div className="product-card">
              <div className="product-card__header">
                <div>
                  <small>LIVE OVERVIEW</small>
                  <h2>Good morning, team</h2>
                </div>
                <div className="mini-avatars"><span>KA</span><span>NO</span></div>
              </div>
              <div className="mini-stats">
                <div><span>Active members</span><strong>1,248</strong><small>↗ 8.4%</small></div>
                <div><span>Today&apos;s sessions</span><strong>32</strong><small>6 upcoming</small></div>
              </div>
              <div className="chart-card">
                <div className="chart-card__heading">
                  <div><small>WEEKLY ACTIVITY</small><strong>2,846 visits</strong></div>
                  <span>Last 7 days⌄</span>
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
                <div className="chart-days"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div>
              </div>
              <div className="session-strip">
                <div className="session-strip__icon"><Icon name="dumbbell" /></div>
                <div><small>NEXT SESSION · 10:30</small><strong>Strength Fundamentals</strong></div>
                <div className="session-strip__people"><span>JD</span><span>+8</span></div>
              </div>
            </div>
            <div className="float-pill float-pill--bottom">
              <span><Icon name="check" size={16} /></span>
              <div><strong>Plan completed</strong><small>Upper Body · Week 4</small></div>
            </div>
          </div>
        </div>
        <div className="hero__ticker" aria-label="Platform benefits">
          <span>{t("landing.ticker1")}</span><b>✦</b><span>{t("landing.ticker2")}</span><b>✦</b><span>{t("landing.ticker3")}</span><b>✦</b><span>{t("landing.ticker4")}</span><b>✦</b><span>{t("landing.ticker5")}</span>
        </div>
      </section>

      <section className="features-section" id="platform">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow"><Icon name="bolt" size={15} /> {t("landing.thePlatform")}</div>
              <h2>{t("landing.everythingYourGymNeeds")}<br /><span>{t("landing.nothingItDoesnt")}</span></h2>
            </div>
            <p>{t("landing.purposeBuilt")}</p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <article className={`feature-card feature-card--${feature.tone}`} key={feature.titleKey}>
                <div className="feature-card__top">
                  <span className="feature-card__icon"><Icon name={feature.icon} size={24} /></span>
                  <small>{feature.number}</small>
                </div>
                <h3>{t(feature.titleKey)}</h3>
                <p>{t(feature.descKey)}</p>
                <a href="#for-you">{t("landing.explorePlatform")} <Icon name="arrow" size={17} /></a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="roles-section" id="for-you">
        <div className="container">
          <div className="roles-intro">
            <div className="eyebrow eyebrow--dark"><Icon name="sparkles" size={15} /> {t("landing.madeForEveryGoal")}</div>
            <h2>{t("landing.oneSystem")}<br /><span>{t("landing.threeViews")}</span></h2>
            <p>{t("landing.everyoneGets")}</p>
          </div>
          <div className="role-grid">
            {roles.map((role, index) => (
              <article className={`role-card role-card--${index + 1}`} key={role.labelKey}>
                <div className="role-card__icon"><Icon name={role.icon} size={23} /></div>
                <small>{t(role.labelKey)}</small>
                <h3>{t(role.titleKey)}</h3>
                <div className="role-card__stat"><strong>{role.stat}</strong><span>{t(role.statLabelKey)}</span></div>
                <Link href="/register">{t("landing.forYou")} <Icon name="arrow" size={17} /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="confidence-section" id="why-us">
        <div className="container confidence-grid">
          <div>
            <div className="eyebrow"><Icon name="shield" size={15} /> {t("landing.builtForLongRun")}</div>
            <h2>{t("landing.simpleDayOne")}<br /><span>{t("landing.powerfulAfter")}</span></h2>
          </div>
          <div className="confidence-list">
            <div><span><Icon name="check" size={17} /></span><p><strong>{t("landing.fastToStart")}</strong>{t("landing.fastToStartDesc")}</p></div>
            <div><span><Icon name="check" size={17} /></span><p><strong>{t("landing.easyToUse")}</strong>{t("landing.easyToUseDesc")}</p></div>
            <div><span><Icon name="check" size={17} /></span><p><strong>{t("landing.readyToGrow")}</strong>{t("landing.readyToGrowDesc")}</p></div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-orbit cta-orbit--one" /><div className="cta-orbit cta-orbit--two" />
        <div className="cta-section__content">
          <div className="eyebrow eyebrow--dark">{t("landing.yourNextRep")}</div>
          <h2>{t("landing.readyToBuild")}<br /><span>{t("landing.somethingStronger")}</span></h2>
          <p>{t("landing.bringYourGym")}</p>
          <Link className="button button--dark" href="/register">{t("landing.getStartedFree")} <Icon name="arrow" size={18} /></Link>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container site-footer__main">
          <Brand light />
          <p>{t("landing.movementManaged")}</p>
          <div><a href="#platform">{t("landing.platform")}</a><a href="#for-you">{t("landing.forYou")}</a><Link href="/login">{t("landing.logIn")}</Link></div>
        </div>
        <div className="container site-footer__bottom"><span>© 2026 KooGYMaa</span><span>{t("landing.madeForPeople")}</span></div>
      </footer>
    </main>
  );
}
