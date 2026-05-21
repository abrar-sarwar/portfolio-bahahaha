// Editorial surface content. Each planet (and the core/about) is a full-page
// immersive surface, not a drawer. Sections render as a flowing column.
import { CALENDLY_URL } from './planets.js';

const COUNTERSTACK_URL = 'https://counterstack.dev';
const GITHUB_URL = 'https://github.com/abrar-sarwar';

export const SURFACES = {
  about: {
    id: 'about',
    tag: 'ABOUT',
    heading: 'Abrar Sarwar',
    tagline: "the core · who's behind all this",
    signature: { kind: 'photo', src: '/assets/sprites/abrarboss1.webp' },
    sections: [
      {
        kind: 'prose',
        title: 'The person',
        text: "yo, the name's Abrar. CIS @ Georgia State, cybersecurity by trade, engineer by soul. I treat every day like a side quest worth grinding. gym is my daily checkpoint, hiking is my fast travel.",
      },
      {
        kind: 'prose',
        title: 'The dream',
        text: "i want to make a story that could genuinely be a manga. think JoJo meets One Piece. real exploration, wild moments, characters with actual depth. still got plenty of ground to cover but it's coming together.",
      },
      {
        kind: 'prose',
        title: 'Atlanta',
        text: 'based in ATL and yeah it absolutely slaps. currently locked in on a coffee shop world tour across the city. if you know a fire spot, send it. the list keeps growing and so does the mission.',
      },
      {
        kind: 'contact',
        title: 'Reach out',
        items: [
          { label: '470-399-2597', href: 'tel:4703992597' },
          { label: 'abrartsarwar@gmail.com', href: 'mailto:abrartsarwar@gmail.com' },
          { label: 'linkedin.com/in/abrar-sarwar', href: 'https://linkedin.com/in/abrar-sarwar' },
          { label: 'github.com/abrar-sarwar', href: GITHUB_URL },
        ],
        calendly: CALENDLY_URL,
      },
    ],
  },

  projects: {
    id: 'projects',
    tag: 'PROJECTS',
    heading: 'Projects',
    tagline: 'built things · shipped things',
    signature: {
      kind: 'terminal',
      lines: [
        '$ portfolio --list-projects',
        '> counterstack    [WINNER · HACKLANTA]',
        '> tripwire        [SHIPPED · AWS]',
        '> glint           [PUBLISHED · OSINT]',
        '$ ',
      ],
    },
    sections: [
      {
        kind: 'headline',
        name: 'CounterStack',
        context: 'Hacklanta Hackathon Winner · built in 12 hours',
        body: 'Consolidated 3 SIEM sources into a PostgreSQL backbone for cross-platform threat analysis. Simplified risk visualization by categorizing resilience, recovery, and technical controls into a 4-card poker hand UX. Full-stack app mapping NIST CSF assessment data to an AI-generated security posture score using Gemini.',
        quote:
          "12 hours, 3 SIEMs, 1 PostgreSQL backbone. we turned NIST CSF scoring into a poker hand because if security posture isn't readable it isn't actionable. that's how we took 1st.",
        tags: ['PostgreSQL', 'Gemini', 'NIST CSF', 'Full-Stack'],
        link: { label: 'VIEW PROJECT', href: COUNTERSTACK_URL },
      },
      {
        kind: 'project',
        name: 'TripWire',
        context: 'Serverless AWS detection & auto-response',
        body: 'Engineered a serverless AWS pipeline (CloudTrail → EventBridge → Lambda) detecting 5 high-risk control-plane events across IAM, S3, EC2 in seconds, mapped to MITRE ATT&CK. Python boto3 remediation Lambdas auto-revert public S3 buckets, open security group rules, and unrestricted IAM policies. Verified on live CloudTrail events at sub-10s response across regions.',
        tags: ['AWS', 'Lambda', 'boto3', 'MITRE ATT&CK', 'Serverless'],
        link: { label: 'VIEW PROJECT', href: GITHUB_URL },
      },
      {
        kind: 'project',
        name: 'GLINT',
        context: 'ShinyHunters OSINT research',
        body: 'In-depth OSINT research on the ShinyHunters threat cluster across 3 major campaigns: UNC5537, UNC6395, and the 2026 Canvas extortion. Every claim cited to Mandiant, vendor disclosures, or major news reporting.',
        tags: ['OSINT', 'Threat Intel', 'Mandiant', 'Research'],
        link: { label: 'VIEW PROJECT', href: GITHUB_URL },
      },
    ],
  },

  experience: {
    id: 'experience',
    tag: 'EXPERIENCE',
    heading: 'Experience',
    tagline: "where i've been · what i've done",
    signature: { kind: 'timeline' },
    sections: [
      {
        kind: 'role',
        title: 'AI Security & IT Intern',
        context: 'Handshake · January 2025 – Present',
        body: 'Evaluated 1,000+ AI-generated outputs for accuracy, consistency, and risk indicators; structured feedback contributed to reliability improvements across 2+ AI models. Applied systematic testing across 5+ output categories including structured prompt variations and adversarial edge-case inputs, improving response error analysis accuracy by 25%.',
      },
      {
        kind: 'role',
        title: 'IT Systems Specialist',
        context: "Step n' Fetch · June 2022 – December 2025",
        body: 'Administered POS and COAM infrastructure across 15+ networked terminals at 98%+ uptime, documenting daily incidents in a ticketing system. Diagnosed and resolved 10–20 daily system incidents (network failures, transaction errors, device communication), cutting downtime by 30% and achieving MTTR under 10 minutes.',
      },
    ],
  },

  cybersecurity: {
    id: 'cybersecurity',
    tag: 'TECHNICAL SKILLS',
    heading: 'Technical Skills',
    tagline: 'the stack · the certs · the discipline',
    signature: { kind: 'certs', items: ['SEC+', 'NET+', 'AWS CP', 'AZ-900'] },
    sections: [
      {
        kind: 'specs',
        items: [
          { label: 'Languages', value: 'Python · Ruby · SQL · C++ · PowerShell · Bash · TypeScript · PHP · Go · YAML · HCL · Groovy' },
          { label: 'Security tools', value: 'Splunk · Wireshark · Snort · Nmap · Nessus · pfSense · Burp Suite · Metasploit · Autopsy · CrowdStrike' },
          { label: 'Cloud & IaC', value: 'AWS (CloudTrail, IAM, VPC) · Azure (Sentinel, Policy) · Terraform · CloudFormation' },
          { label: 'Coursework', value: 'Intermediate Cybersecurity · Systems and Network · Managing with AI · Cybersecurity Tools and Solutions · System Analysis · Data Management with AI' },
          { label: 'Education', value: 'Georgia State University · B.B.A Computer Information Systems · May 2028 · GPA 3.71' },
        ],
      },
    ],
  },

  leadership: {
    id: 'leadership',
    tag: 'LEADERSHIP',
    heading: 'Leadership',
    tagline: 'where i lead · what i build',
    signature: { kind: 'rank', big: 'TOP 10%', sub: '724 / 7,006 · NCL SPRING 2026' },
    sections: [
      {
        kind: 'role',
        title: 'Vice President · NCL Competitor',
        context: 'GSU Cybersecurity Club · December 2025 – Present',
        body: 'Led planning of 3+ cybersecurity workshops per semester by coordinating with industry speakers, sustaining 50+ attendees per session and growing club engagement by 20% across the semester. Ranked top 10% individually (724/7,006) and top 6% in team play (224/3,638) at NCL Spring 2026, covering OSINT, cryptography, network and log analysis, forensics, web exploitation, and enumeration.',
      },
      {
        kind: 'role',
        title: 'Director of Analysis',
        context: 'progsu · March 2026 – Present',
        body: 'Built a centralized member database tracking 100+ students against participation requirements across events, workshops, and competitions, automating compliance checks and cutting onboarding to active status time by 35%. Created reporting workflows and performance dashboards for executive leadership covering budget burn, revenue tracking, sponsor pipeline, and expense categorization, cutting event review and strategic planning time by 40%.',
      },
    ],
  },

  events: {
    id: 'events',
    tag: 'EVENTS',
    heading: 'Events',
    tagline: "what's shipped · what's coming",
    signature: { kind: 'radar' },
    sections: [
      {
        kind: 'eventcard',
        status: 'shipped',
        title: 'Hacklanta · Organizer',
        badge: 'SHIPPED',
        body: 'this was the opening hand. 400 students at the table and i ran point on marketing and engagement. my job was reading the room, filling every seat, and keeping the energy stacked from the first deal to the last call. we played it right and the house was full. a real poker night for hackers, and everybody went all in.',
        linkWord: 'Hacklanta',
        linkHref: 'https://hacklanta.dev',
      },
      {
        kind: 'eventcard',
        status: 'shipped',
        title: 'Hacklanta 2 · Organizer',
        badge: 'SCALING UP',
        body: 'now we turn the volume all the way up. Hacklanta 2 is built to pull 1000+ students from every corner of the state onto one stage, with real prize money on the line. less quiet study room, more sold out show. i am helping run the set so the whole state shows up on the same frequency and the crowd actually feels like a crowd.',
        linkWord: 'Hacklanta',
        linkHref: 'https://hacklanta.dev',
      },
      {
        kind: 'eventcard',
        status: 'classified',
        classifiedName: 'OPERATION BUCCANEER',
        title: "Spring '26",
        badge: 'CLASSIFIED',
        body: 'still flying under the black flag. operation buccaneer is an upcoming event planned for spring that opens a whole new chapter. the crew is assembling, the map is already drawn, and we set sail soon. the treasure stays buried until then.',
      },
      { kind: 'quote', text: 'want the real details. just come ask me, captain to captain.' },
    ],
  },
};
