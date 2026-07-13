import DestinationShell, { Reveal } from './DestinationShell.jsx';
import { Mail, Linkedin, Github, Send, FileText, ArrowUpRight } from '../icons/Icons.jsx';

const CHANNELS = [
    {
        icon: Mail,
        label: 'Email',
        value: 'lidesmond2323@gmail.com',
        href: 'mailto:lidesmond2323@gmail.com',
    },
    {
        icon: Linkedin,
        label: 'LinkedIn',
        value: 'Desmond Li',
        href: 'https://www.linkedin.com/in/desmond-li-aa1935321/',
        external: true,
    },
    {
        icon: Github,
        label: 'GitHub',
        value: '/desm2323',
        href: 'https://github.com/desm2323',
        external: true,
    },
];

const ContactDestination = ({ open, onClose }) => (
    <DestinationShell
        open={open}
        onClose={onClose}
        className="dest-contact"
        id="contact"
        index="04"
        eyebrow="Open a Channel"
        title="Contact"
    >
        <Reveal>
            <p className="dest-lede">
                Currently seeking software engineering internships and graduate roles —
                and always happy to talk about interesting projects and opportunities.
                Feel free to reach out through any of the channels below.
            </p>
        </Reveal>

        <Reveal className="contact-channels">
            {CHANNELS.map((channel) => {
                const ChannelIcon = channel.icon;
                return (
                    <a
                        className="contact-channel"
                        href={channel.href}
                        key={channel.label}
                        target={channel.external ? '_blank' : undefined}
                        rel={channel.external ? 'noreferrer' : undefined}
                    >
                        <span className="contact-channel-icon" aria-hidden="true">
                            <ChannelIcon />
                        </span>
                        <span className="contact-channel-text">
                            <span className="contact-channel-label">{channel.label}</span>
                            <span className="contact-channel-value">{channel.value}</span>
                        </span>
                        <ArrowUpRight className="contact-channel-arrow" />
                    </a>
                );
            })}
        </Reveal>

        <Reveal className="dest-actions">
            <a className="dest-btn dest-btn--solid" href="mailto:lidesmond2323@gmail.com">
                <Send />
                Email me
            </a>
            <a className="dest-btn dest-btn--ghost" href="/Desmond_Li_CV.pdf" download>
                <FileText />
                Download CV
            </a>
        </Reveal>
    </DestinationShell>
);

export default ContactDestination;
