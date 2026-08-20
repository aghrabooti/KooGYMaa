import Link from "next/link";
import { Brand } from "@/components/brand";
import { Icon, type IconName } from "@/components/icon";

const features: Array<{
  icon: IconName;
  number: string;
  title: string;
  description: string;
  tone: string;
}> = [
  {
    icon: "grid",
    number: "01",
    title: "Run the whole floor",
    description: "Members, subscriptions, check-ins, and operations—clear, connected, and never buried in spreadsheets.",
    tone: "lime",
  },
  {
    icon: "clipboard",
    number: "02",
    title: "Coach with context",
    description: "Build workout and nutrition plans, follow progress, and keep every client moving toward the next win.",
    tone: "orange",
  },
  {
    icon: "trend",
    number: "03",
    title: "Make progress visible",
    description: "Members see their plans, streaks, and milestones in a focused space designed to keep motivation high.",
    tone: "violet",
  },
];

const roles = [
  { label: "GYM OWNERS", title: "Less admin. More momentum.", icon: "bar-chart" as IconName, stat: "24h", statLabel: "saved every month" },
  { label: "TRAINERS", title: "Every client, fully in view.", icon: "users" as IconName, stat: "3.2×", statLabel: "faster plan building" },
  { label: "MEMBERS", title: "Know the plan. Feel the progress.", icon: "flame" as IconName, stat: "82%", statLabel: "stay on track" },
];

export default function Home() {
  return (
    <main className="landing-page">
      <section className="hero" id="home">
        <nav className="site-nav" aria-label="Main navigation">
          <Brand light />
          <div className="site-nav__links">
            <a href="#platform">Platform</a>
            <a href="#for-you">For you</a>
            <a href="#why-us">Why KooGYMaa</a>
          </div>
          <div className="site-nav__actions">
            <Link className="nav-login" href="/login">Log in</Link>
            <Link className="button button--lime button--small" href="/register">
              Get started <Icon name="arrow" size={16} />
            </Link>
          </div>
        </nav>

        <div className="hero__glow" />
        <div className="hero__grid container">
          <div className="hero__copy">
            <div className="eyebrow eyebrow--dark">
              <span className="live-dot" />
              One place for every rep
            </div>
            <h1>
              Move better.
              <br />
              <span>Manage smarter.</span>
            </h1>
            <p className="hero__lead">
              KooGYMaa brings gym operations, coaching, and member progress into one beautifully simple workspace.
            </p>
            <div className="hero__actions">
              <Link className="button button--lime" href="/register">
                Start building momentum <Icon name="arrow" size={18} />
              </Link>
              <a className="button button--ghost" href="#platform">
                <span className="play-icon">▶</span> Explore the platform
              </a>
            </div>
            <div className="hero__proof">
              <div className="avatar-stack" aria-hidden="true">
                <span>AM</span><span>JR</span><span>KL</span><span>+2k</span>
              </div>
              <div>
                <div className="hero__stars">★★★★★ <strong>4.9</strong></div>
                <p>Loved by teams that move</p>
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
          <span>GYM OPERATIONS</span><b>✦</b><span>COACHING TOOLS</span><b>✦</b><span>MEMBER PROGRESS</span><b>✦</b><span>ONE CONNECTED SPACE</span><b>✦</b><span>BETTER EVERY DAY</span>
        </div>
      </section>

      <section className="features-section" id="platform">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow"><Icon name="bolt" size={15} /> THE PLATFORM</div>
              <h2>Everything your gym needs.<br /><span>Nothing it doesn&apos;t.</span></h2>
            </div>
            <p>Purpose-built tools that keep the work simple and put people, progress, and performance first.</p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <article className={`feature-card feature-card--${feature.tone}`} key={feature.title}>
                <div className="feature-card__top">
                  <span className="feature-card__icon"><Icon name={feature.icon} size={24} /></span>
                  <small>{feature.number}</small>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <a href="#for-you">See what&apos;s inside <Icon name="arrow" size={17} /></a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="roles-section" id="for-you">
        <div className="container">
          <div className="roles-intro">
            <div className="eyebrow eyebrow--dark"><Icon name="sparkles" size={15} /> MADE FOR EVERY GOAL</div>
            <h2>One system.<br /><span>Three powerful views.</span></h2>
            <p>Everyone gets exactly what they need—without the noise they don&apos;t.</p>
          </div>
          <div className="role-grid">
            {roles.map((role, index) => (
              <article className={`role-card role-card--${index + 1}`} key={role.label}>
                <div className="role-card__icon"><Icon name={role.icon} size={23} /></div>
                <small>{role.label}</small>
                <h3>{role.title}</h3>
                <div className="role-card__stat"><strong>{role.stat}</strong><span>{role.statLabel}</span></div>
                <Link href="/register">Explore your view <Icon name="arrow" size={17} /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="confidence-section" id="why-us">
        <div className="container confidence-grid">
          <div>
            <div className="eyebrow"><Icon name="shield" size={15} /> BUILT FOR THE LONG RUN</div>
            <h2>Simple on day one.<br />Powerful every day after.</h2>
          </div>
          <div className="confidence-list">
            <div><span><Icon name="check" size={17} /></span><p><strong>Fast to start</strong>Set up your workspace and invite your team in minutes.</p></div>
            <div><span><Icon name="check" size={17} /></span><p><strong>Easy to use</strong>A focused interface people actually enjoy coming back to.</p></div>
            <div><span><Icon name="check" size={17} /></span><p><strong>Ready to grow</strong>From your first member to your next location.</p></div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-orbit cta-orbit--one" /><div className="cta-orbit cta-orbit--two" />
        <div className="cta-section__content">
          <div className="eyebrow eyebrow--dark">YOUR NEXT REP STARTS HERE</div>
          <h2>Ready to build<br /><span>something stronger?</span></h2>
          <p>Bring your gym, your people, and your progress together.</p>
          <Link className="button button--dark" href="/register">Get started for free <Icon name="arrow" size={18} /></Link>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container site-footer__main">
          <Brand light />
          <p>Movement, managed beautifully.</p>
          <div><a href="#platform">Platform</a><a href="#for-you">For you</a><Link href="/login">Log in</Link></div>
        </div>
        <div className="container site-footer__bottom"><span>© 2026 KooGYMaa</span><span>Made for people who move.</span></div>
      </footer>
    </main>
  );
}
