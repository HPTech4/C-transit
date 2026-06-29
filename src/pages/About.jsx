import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaArrowRight,
  FaUserPlus,
  FaIdCard,
  FaWallet,
  FaBolt,
  FaCompressArrowsAlt,
  FaTools,
  FaHandshake,
  FaForward,
} from 'react-icons/fa';
import styles from './AboutPage.module.css';

const ROUTE_STOPS = [
  { icon: <FaUserPlus />, label: 'Create an account' },
  { icon: <FaIdCard />, label: 'Link their student card' },
  { icon: <FaWallet />, label: 'Fund their transportation wallet' },
  { icon: <FaBolt />, label: 'Access rides with a single tap' },
];

const PRINCIPLES = [
  { icon: <FaCompressArrowsAlt />, title: 'Remove Friction', desc: 'Every decision we make must simplify movement.' },
  { icon: <FaTools />, title: 'Build for Reality', desc: 'We design for real-world conditions, not ideal assumptions.' },
  { icon: <FaHandshake />, title: 'Earn Trust', desc: 'Security, reliability, and accountability are at the center of our platform.' },
  { icon: <FaForward />, title: 'Keep Moving Forward', desc: 'Progress happens through continuous learning, testing, and improvement.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.topBar}>
          <button className={styles.backBtnDark} onClick={() => navigate('/')}>
            <FaArrowLeft /> Back
          </button>
        </div>

        <div className={styles.heroContent}>
          <span className={styles.eyebrowDark}>About C-Transit</span>
          <h1>Campus Transport.<br />Without the Nonsense.</h1>
          <p className={styles.heroLead}>
            Every day, thousands of students rely on campus transportation to get
            to lectures, laboratories, exams, and important academic activities.
            Yet the experience remains frustratingly familiar: no change, failed
            transfers, long delays, and unreliable payment methods.
          </p>
          <p className={styles.heroPunch}>C-Transit was created to change that.</p>
          <p className={styles.heroLead}>
            We are building an intelligent mobility payment infrastructure
            designed specifically for transportation systems operating in
            real-world environments where connectivity is unreliable, cash
            dependency remains common, and efficiency matters.
          </p>
          <p className={styles.heroGoal}>
            Our goal is simple: <span>make movement faster, simpler, and stress-free.</span>
          </p>
        </div>
      </section>

      {/* ── Our Story ─────────────────────────────────────────────────── */}
      <motion.section
        className={styles.storySection}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
      >
        <div className={styles.storyQuote}>
          <span className={styles.sectionLabel}>Our Story</span>
          <p className={styles.bigQuote}>
            "What started as an idea has grown into a multidisciplinary team."
          </p>
        </div>
        <div className={styles.storyBody}>
          <p>
            C-Transit began as a conversation among students who were tired of
            experiencing the same transportation problems every day.
          </p>
          <p>
            The more we looked into the issue, the more we realized that
            transportation was one of the most important yet overlooked
            challenges affecting student life.
          </p>
          <p>
            Rather than accepting the problem, we decided to build a solution —
            a team of student innovators, engineers, and builders working to
            create a better transportation experience for campuses and
            emerging environments.
          </p>
        </div>
      </motion.section>

      {/* ── What We Do — Route Line ──────────────────────────────────── */}
      <motion.section
        className={styles.routeSection}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
      >
        <span className={styles.sectionLabel}>What We Do</span>
        <h2 className={styles.sectionTitle}>One tap, the whole journey.</h2>
        <p className={styles.sectionIntro}>
          C-Transit enables students to access transportation through a simple
          tap-and-ride experience.
        </p>

        <div className={styles.routeLine}>
          {ROUTE_STOPS.map((stop, i) => (
            <div className={styles.routeStop} key={stop.label}>
              <div className={styles.routeStopNumber}>{i + 1}</div>
              <div className={styles.routeStopIcon}>{stop.icon}</div>
              <p>{stop.label}</p>
            </div>
          ))}
        </div>

        <p className={styles.routeNote}>
          Our technology is designed to continue functioning even during
          temporary internet disruptions, ensuring transportation remains
          accessible when users need it most.
        </p>
      </motion.section>

      {/* ── Why It Matters — Manifesto ────────────────────────────────── */}
      <section className={styles.manifesto}>
        <motion.p
          className={styles.manifestoLine}
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.6 }} variants={fadeUp}
        >
          A student should not miss a lecture because a driver has no change.
        </motion.p>
        <motion.p
          className={`${styles.manifestoLine} ${styles.manifestoRight}`}
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.6 }} variants={fadeUp}
        >
          A student should not be stranded because mobile transfers fail.
        </motion.p>
        <motion.p
          className={styles.manifestoLine}
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.6 }} variants={fadeUp}
        >
          A student should not have to choose between punctuality and payment convenience.
        </motion.p>
        <motion.p
          className={styles.manifestoClose}
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.6 }} variants={fadeUp}
        >
          We believe transportation should simply work.
        </motion.p>
      </section>

      {/* ── Vision & Mission ──────────────────────────────────────────── */}
      <motion.section
        className={styles.visionSection}
        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}
      >
        <div className={styles.visionCol}>
          <span className={styles.sectionLabel}>Our Vision</span>
          <p>
            We are not just building a payment system. We are building the
            foundation for intelligent mobility infrastructure across emerging
            environments.
          </p>
          <p>
            From campus mobility to metropolitan transportation, logistics
            coordination, and future transportation technologies, we are
            building toward a world where movement happens without
            unnecessary friction.
          </p>
        </div>

        <div className={styles.missionBox}>
          <span className={styles.sectionLabelLight}>Our Mission</span>
          <p>
            To create reliable, accessible, and intelligent mobility solutions
            that eliminate transportation friction and improve everyday
            movement for people and communities.
          </p>
        </div>
      </motion.section>

      {/* ── Core Principles ───────────────────────────────────────────── */}
      <motion.section
        className={styles.principlesSection}
        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp}
      >
        <span className={styles.sectionLabel}>Our Core Principles</span>
        <div className={styles.principlesGrid}>
          {PRINCIPLES.map(p => (
            <div className={styles.principleCard} key={p.title}>
              <div className={styles.principleIcon}>{p.icon}</div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── Join the Journey + Kinetic Close ─────────────────────────── */}
      <section className={styles.closeSection}>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }} variants={fadeUp}
        >
          <span className={styles.eyebrowDark}>Join the Journey</span>
          <p className={styles.closeText}>
            C-Transit is still being built. Every test, every ride, every
            improvement, and every piece of feedback brings us closer to a
            future where transportation simply works.
          </p>
          <p className={styles.closeTextSub}>We're excited to have you with us.</p>
        </motion.div>

        <div className={styles.tapRideMove}>
          {['Tap.', 'Ride.', 'Move.'].map((word, i) => (
            <motion.span
              key={word}
              className={styles.tapWord}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ duration: 0.5, delay: i * 0.25 }}
            >
              {word}
            </motion.span>
          ))}
        </div>

        <motion.button
          className={styles.ctaBtn}
          onClick={() => navigate('/contact')}
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }} variants={fadeUp}
        >
          Get in Touch <FaArrowRight />
        </motion.button>
      </section>
    </div>
  );
}