import DestinationShell, { Reveal } from './DestinationShell.jsx';
import { ExternalLink, Github } from '../icons/Icons.jsx';
import { asset } from '../../asset.js';

// live/source are optional — a button only renders when its link exists.
// image is optional too; if the file is missing the gradient thumb shows.
const PROJECTS = [
    {
        index: '01',
        title: 'Powerlifting Programming Agent',
        tagline: 'Autonomous AI Coach · Prototype',
        desc: 'An autonomous agent that writes and auto-regulates a powerlifting program — it commits a weekly plan, reads free-text session feedback, tracks fatigue, and decides whether to progress, hold, or deload. Built as a perceive → reason → guard → decide → act loop (~9,000 lines) with a guardrail layer: deterministic, offline-first and unit-tested, with the LLM parsing feedback — never picking weights.',
        tags: ['Python', 'LLM Tool-Calling · ReAct', 'OpenAI API', 'Streamlit'],
        source: 'https://github.com/desm2323/Powerlifting-Programming-Agent',
        image: '/projects/powerlifting-agent.webp',
    },
    {
        index: '02',
        title: 'BearLingo',
        tagline: 'Gamified Job-Hunt Companion · BSc Capstone',
        desc: 'A gamified cross-platform mobile app (iOS & Android) that helps recent graduates through the job-seeking process — streaks, progress tracking, points and badges keep momentum up, with AI-powered feedback woven in. Co-developed in a third-year capstone team.',
        tags: ['Flutter', 'Firebase', 'Team Project'],
        source: 'https://github.com/uoa-compsci399-s2-2025/capstone-project-s2-2025-team-14',
        image: '/projects/bearlingo.webp',
    },
    {
        index: '03',
        title: 'AUSS Official Website',
        tagline: 'Club Platform Backend · In Development',
        desc: 'Backend for the official University of Auckland Powerlifting Club website — a real-world stakeholder project. REST endpoints and server-side logic in Node.js / Express, with Prisma over a Dockerised PostgreSQL instance, built in a five-person team. (Repo private while in development.)',
        tags: ['Node.js', 'Express', 'Prisma', 'PostgreSQL', 'Docker'],
        image: '/projects/auss.webp',
    },
    {
        index: '04',
        title: 'Personal Website',
        tagline: 'Interactive 3D Portfolio · Ongoing',
        desc: 'My personal portfolio — an interactive 3D website built with React and React Three Fiber, with smooth scroll-driven navigation, custom animations, and a hand-built design system, all tuned to stay fast on a strict performance budget. Designed and developed from scratch.',
        tags: ['React', 'React Three Fiber', 'Vite', 'Tailwind CSS'],
        source: 'https://github.com/desm2323/Personal-Portfolio',
        image: '/projects/personal-website.webp',
    },
];

const ProjectsDestination = ({ open, onClose }) => (
    <DestinationShell
        open={open}
        onClose={onClose}
        className="dest-projects"
        id="projects"
        index="03"
        eyebrow="Cataloged Systems"
        title="Projects"
    >
        <div className="proj-list">
            {PROJECTS.map((project) => (
                <Reveal key={project.index}>
                    <article className="proj-card">
                        <div className="proj-thumb" aria-hidden="true">
                            {project.image && (
                                <>
                                    {/* Blurred cover-fill so letterbox space reads as
                                        part of the shot, not empty space. */}
                                    <img
                                        className="proj-thumb-backdrop"
                                        src={asset(project.image)}
                                        alt=""
                                        loading="lazy"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                    <img
                                        className="proj-thumb-img"
                                        src={asset(project.image)}
                                        alt=""
                                        loading="lazy"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </>
                            )}
                            <span className="proj-index">{project.index}</span>
                        </div>
                        <div className="proj-info">
                            <h3 className="proj-title">{project.title}</h3>
                            <p className="proj-tagline">{project.tagline}</p>
                            <p className="proj-desc">{project.desc}</p>
                            <div className="proj-tags">
                                {project.tags.map((tag) => (
                                    <span className="proj-tag" key={tag}>{tag}</span>
                                ))}
                            </div>
                            {(project.live || project.source) && (
                                <div className="dest-actions">
                                    {project.live && (
                                        <a
                                            className="dest-btn dest-btn--solid"
                                            href={project.live}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <ExternalLink />
                                            Live
                                        </a>
                                    )}
                                    {project.source && (
                                        <a
                                            className="dest-btn dest-btn--ghost"
                                            href={project.source}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <Github />
                                            Source
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </article>
                </Reveal>
            ))}
        </div>
    </DestinationShell>
);

export default ProjectsDestination;
