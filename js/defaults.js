/* Seed content, compiled from public sources (RSU Vice-Chancellor profile pages, Google Scholar,
   ResearchGate, Academia.edu and news coverage). Everything here is editable from the admin dashboard. */
window.DEFAULTS = {
  settings: {
    hero: {
      eyebrow: 'Office of the Vice-Chancellor',
      name_first: 'Prof. Isaac',
      name_last: 'Zeb-Obipi',
      title: '12th Vice-Chancellor, Rivers State University',
      tagline: 'Professor of Organizational Behaviour and Human Resource Management',
      headshot_url: '',
      badges: [
        { value: '1997', label: 'Joined RSU as Assistant Lecturer' },
        { value: '2018', label: 'Professor of Management' }
      ]
    },
    bio: {
      lead: 'A teacher first, an administrator by calling, and a builder of people and systems.',
      paragraphs: [
        'Professor Isaac Zeb-Obipi is the 12th Vice-Chancellor of Rivers State University, Port Harcourt, and its ninth substantive holder of the office. He assumed duty on 6 March 2025 after placing first among fifteen candidates in the Joint Council-Senate selection process, scoring above 90 per cent.',
        'He hails from Ogoloma in Okrika Local Government Area of Rivers State, where he also holds a traditional stool as Chief Ogulacha II. His working life began in the classroom: he started teaching during his National Youth Service year in 1988, joined the Post Primary Schools Management Board in 1991 as a Master Grade II teacher, and rose to Senior Master in Economics before moving to the university.',
        'In April 1997 he joined Rivers State University as an Assistant Lecturer and has been part of its story ever since. He became Professor of Management in 2018, with research interests in organizational behaviour, human resource management, industrial relations and business research. Along the way he has served as Faculty Examination Officer, Sub-Dean, twice Associate Dean, Head of Department, Dean of Student Affairs, president of the Senior Staff Club and member of the Governing Council, and he is the university\'s longest-serving Orator, having read the citations for 71 of its first 109 inaugural lecturers.',
        'Technology has been a thread through all of it. As Faculty Examination Officer he led the shift from manual to electronic result processing and received a national ICT4D award for advancing ICT in education. He later directed the university\'s ICT Centre from March 2022, earning a reputation among colleagues as the "digital Vice-Chancellor". His 2022 inaugural lecture, "People Management Tripod and Worker Productivity: The Solute, Solvent and Solution", argued for a department dedicated to Human Resource Management and Industrial Relations, a proposal the university acted on.',
        'As Vice-Chancellor he has set out priorities in academic excellence, research and innovation, student experience, staff development, industry collaboration and global ranking. At his first convocation he reported accommodation for 40,000 students and full accreditation of all academic programmes, and in 2026 the university inaugurated its Open and Distance Learning Centre and commissioned a community ICT centre at Nkpolu-Oroworukwo.',
        'Away from the office he is a Christian, a husband to Mrs Victoria Zeb-Obipi and a father of two, a former student unionist who led the Postgraduate Students\' Association as its first elected president, and a devoted Arsenal supporter.'
      ],
      highlights: [
        { value: '29', label: 'Years at Rivers State University' },
        { value: '2007', label: 'PhD, Organizational Behaviour' },
        { value: '2018', label: 'Professor of Management' },
        { value: '12th', label: 'Vice-Chancellor of RSU' }
      ],
      credentials: ['B.Ed. (Ibadan)', 'MBA', 'PhD', 'FIHNR', 'FIMC', 'MTAMN', 'MCIPM'],
      memberships: 'Fellow, Institute of Natural and Human Resources of Nigeria · Member, Chartered Institute of Personnel Management of Nigeria · Member, Nigerian Institute of Management · Member, The Academy of Management Nigeria',
      quote: 'Managers should be well trained in the sciences and logic of Organizational Behaviour, Human Resource Management and Industrial Relations.',
      quote_source: 'Inaugural Lecture, 27 July 2022'
    },
    contact: {
      email: 'zeb-obipi.isaac@ust.edu.ng',
      office: 'Office of the Vice-Chancellor, Rivers State University, Nkpolu-Oroworukwo, PMB 5080, Port Harcourt, Rivers State, Nigeria',
      phone: '',
      website: 'https://www.rsu.edu.ng'
    },
    socials: [
      { key: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/isaac-zeb-obipi-54347a14/' },
      { key: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/isaac.zebobipi/' },
      { key: 'globe', label: 'Rivers State University', url: 'https://www.rsu.edu.ng/vice-chancellor/' },
      { key: 'file-text', label: 'Google Scholar', url: 'https://scholar.google.com/citations?user=LZmm8WwAAAAJ' },
      { key: 'book-open', label: 'ResearchGate', url: 'https://www.researchgate.net/profile/Isaac-Zeb-Obipi' },
      { key: 'graduation', label: 'Academia.edu', url: 'https://rsust.academia.edu/IsaacZebobipi' }
    ],
    footer: {
      about: 'Professor of Management and 12th Vice-Chancellor of Rivers State University, Port Harcourt. Scholar of organizational behaviour, human resource management and industrial relations.',
      copyright: 'Prof. Isaac Zeb-Obipi',
      note: 'Biographical information is drawn from Rivers State University publications and public sources.'
    },
    availability: {
      days: [1, 2, 3, 4, 5],
      start: '10:00',
      end: '16:00',
      break_start: '13:00',
      break_end: '14:00',
      step_minutes: 30,
      lead_days: 2,
      horizon_days: 60,
      blocked_dates: [],
      notice: 'All times are West Africa Time (WAT, UTC+1). Requests are reviewed personally; you will see the decision on your account.'
    }
  },
  items: {
    timeline: [
      { kind: 'study', start: '1984', end: '', title: 'West African School Certificate', org: 'Government Secondary School, Abissa', detail: 'Secondary education in Rivers State.' },
      { kind: 'study', start: '1988', end: '', title: 'B.Ed. Economics (Second Class Upper)', org: 'University of Ibadan', detail: 'Studied through the then College of Education, Rumuolumeni, now Ignatius Ajuru University of Education.' },
      { kind: 'work', start: '1988', end: '1989', title: 'National Youth Service', org: 'NYSC', detail: 'Began his teaching career during the service year.' },
      { kind: 'work', start: '1991', end: '1997', title: 'Master Grade II rising to Senior Master (Economics)', org: 'Post Primary Schools Management Board, Rivers State', detail: 'Taught economics in secondary schools before transferring his service to the university.' },
      { kind: 'study', start: '1996', end: '', title: 'MBA, Management', org: 'Rivers State University of Science and Technology', detail: 'Postgraduate training in management at what is now Rivers State University.' },
      { kind: 'work', start: '1997', end: '', title: 'Assistant Lecturer', org: 'Rivers State University', detail: 'Joined the Department of Management on 21 April 1997.' },
      { kind: 'study', start: '2007', end: '', title: 'PhD, Organizational Behaviour', org: 'Rivers State University of Science and Technology', detail: 'Doctoral research in organizational behaviour.' },
      { kind: 'work', start: '1997', end: '2022', title: 'Departmental, Faculty and University offices', org: 'Rivers State University', detail: 'Faculty Examination Officer (led the move to electronic results and won an ICT4D award), Sub-Dean, twice Associate Dean of Management Sciences, Head of Department, Dean of Student Affairs, two-time president of the Senior Staff Club, and Alumni Representative on the Governing Council.' },
      { kind: 'work', start: '2018', end: '', title: 'Professor of Management', org: 'Rivers State University', detail: 'Specialising in Organizational Behaviour, Human Resource Management and Industrial Relations.' },
      { kind: 'work', start: '2022', end: '2025', title: 'Director, ICT Centre', org: 'Rivers State University', detail: 'Seventh Director of the Centre, from 28 March 2022. Delivered the university\'s 79th Inaugural Lecture on 27 July 2022.' },
      { kind: 'current', start: '2025', end: 'Present', title: '12th Vice-Chancellor', org: 'Rivers State University, Port Harcourt', detail: 'Appointed by the Visitor and Governor of Rivers State with effect from 6 March 2025 after topping a field of fifteen candidates.' }
    ],
    courses: [
      { level: 'Postgraduate', code: '', title: 'Organizational Behaviour', description: 'How individuals, groups and structures shape behaviour, commitment and performance at work. Core to his PhD training and doctoral supervision.', area: 'MSc / PhD' },
      { level: 'Postgraduate', code: '', title: 'Human Resource Management', description: 'Strategic and operational people management: resourcing, development, reward, retention and HR information systems.', area: 'MSc / PhD' },
      { level: 'Postgraduate', code: '', title: 'Industrial Relations', description: 'Frameworks for analysing employment relations, collective bargaining, conflict and the roles of employers, unions and the state.', area: 'MSc / PhD' },
      { level: 'Postgraduate', code: '', title: 'Business Research Methods', description: 'Research paradigms, design and analysis in the social and management sciences.', area: 'MSc / PhD' },
      { level: 'Undergraduate', code: '', title: 'Organizational Behaviour', description: 'Foundations of motivation, leadership, teams, culture and conflict for management students.', area: 'B.Sc. Management' },
      { level: 'Undergraduate', code: '', title: 'Human Resource Management', description: 'Introduction to the people-management functions and their link to organizational productivity.', area: 'B.Sc. Management' },
      { level: 'Undergraduate', code: '', title: 'Industrial Relations', description: 'Introduction to employment relations theory and practice in the Nigerian workplace.', area: 'B.Sc. Management' }
    ],
    publications: [
      { type: 'Lecture', topic: 'productivity', title: 'People Management Tripod and Worker Productivity: The Solute, Solvent and Solution', authors: 'Isaac Zeb-Obipi', venue: 'Rivers State University, 79th Inaugural Lecture Series', year: '2022', url: 'https://www.rsu.edu.ng/wp-content/uploads/2022/08/79-lecture-July-2022.pdf', featured: true },
      { type: 'Journal article', topic: 'leadership', title: 'Leadership Representation and Managerial Practices in Nollywood Films: Insights for Organizational Behaviour', authors: 'Isaac Zeb-Obipi, Perpetua Ogechi Vitalis', venue: 'Vol. 3 No. 3, pp. 127–147 (July 2026)', year: '2026', url: 'https://ejournal.agungmediapublisher.com/index.php/iijb/issue/view/81' },
      { type: 'Journal article', topic: 'productivity', title: 'Employee Productivity in Nigeria: Challenges and Prospects', authors: 'G. L. Kpurunee, K. I. Amadi, I. Zeb-Obipi', venue: 'Research Journal of Management Practice 4(10), 49–64', year: '2024', url: 'https://scholar.google.com/citations?user=LZmm8WwAAAAJ' },
      { type: 'Journal article', topic: 'sdg', title: 'Sustainable Development Goals (SDGs): Content, Importance, Implementation Challenges and the Roles of the Management Scientist', authors: 'Isaac Zeb-Obipi, Mary Inimotimi Nkemdilim Okeah', venue: 'Nigerian Academy of Management Journal 18(1), 139–148', year: '2023', url: 'https://www.researchgate.net/publication/373217038_SUSTAINABLE_DEVELOPMENT_GOALS_SDGs_CONTENT_IMPORTANCE_IMPLEMENTATION_CHALLENGES_AND_THE_ROLES_OF_THE_MANAGEMENT_SCIENTIST' },
      { type: 'Journal article', topic: 'hr', title: 'Reward System: A Tool for Employee Retention as Observed from the Banking Sector in Port Harcourt', authors: 'Ovunda Amadi, Isaac Zeb-Obipi, Sorbarikor Lebura, Godwin Poi', venue: 'Journal of Human Resource Management 9(2), 50–57', year: '2021', url: 'https://doi.org/10.11648/j.jhrm.20210902.14' },
      { type: 'Journal article', topic: 'culture', title: 'Boss-Driven Development and Employee Commitment in Telecommunication Firms in Nigeria', authors: 'Peace D. Gabriel, Isaac Zeb-Obipi', venue: 'British Journal of Management and Marketing Studies', year: '2021', url: 'https://rsust.academia.edu/IsaacZebobipi' },
      { type: 'Journal article', topic: 'conflict', title: 'Compromise Conflict Management Style and its Impact on Organizational Health of Federal Agencies in Rivers State, Nigeria', authors: 'Dickson Bamson, Isaac Zeb-Obipi', venue: 'Academia.edu / journal publication', year: '2020', url: 'https://rsust.academia.edu/IsaacZebobipi' },
      { type: 'Journal article', topic: 'employee', title: 'Employee Involvement in Organizations: Benefits, Challenges and Implications', authors: 'O. Obiekwe, I. Zeb-Obipi, H. Ejo-Orusa', venue: 'Management and Human Resource Research Journal 8(8), 1–11', year: '2019', url: 'https://scholar.google.com/citations?user=LZmm8WwAAAAJ' },
      { type: 'Journal article', topic: 'culture', title: 'Workplace Social Infrastructure and Employee Commitment: A Literature Review', authors: 'J. T. Agada, I. Zeb-Obipi', venue: 'International Journal of Human Resources Management 7(2), 1–12', year: '2018', url: 'https://scholar.google.com/citations?user=LZmm8WwAAAAJ' },
      { type: 'Journal article', topic: 'ir', title: 'Frameworks of Industrial Relations Analysis: A Re-visit to Industrial Relations Theory', authors: 'Isaac Zeb-Obipi', venue: 'International Journal of Human Resources Management 7(1), 1–12', year: '2018', url: 'https://scholar.google.com/citations?user=LZmm8WwAAAAJ' },
      { type: 'Journal article', topic: 'culture', title: 'Team-based Family Culture and Employee Involvement in the Nigerian Manufacturing Firms', authors: 'O. Obiekwe, I. Zeb-Obipi', venue: 'International Journal of Social Sciences and Management Research 4(1), 52–60', year: '2018', url: 'https://scholar.google.com/citations?user=LZmm8WwAAAAJ' },
      { type: 'Journal article', topic: 'hr', title: 'Recruitment Management System and Employee Procurement in the Oil and Gas Sector in Nigeria', authors: 'Isaac Zeb-Obipi et al.', venue: 'International Journal of Human Resource Management and Research', year: '2018', url: 'https://rsust.academia.edu/IsaacZebobipi' },
      { type: 'Journal article', topic: 'employee', title: 'Workplace Social Programmes and Employee Commitment: A Literary Reflection', authors: 'Isaac Zeb-Obipi, J. T. Agada', venue: 'IOSR Journal of Business and Management 20(1), 9–16', year: '2017', url: 'https://scholar.google.com/citations?user=LZmm8WwAAAAJ' },
      { type: 'Journal article', topic: 'leadership', title: 'Emotional Reflexivity and Leader Effectiveness', authors: 'A. Kpakol, I. Zeb-Obipi', venue: 'IOSR Journal of Business and Management', year: '2017', url: 'https://scholar.google.com/citations?user=LZmm8WwAAAAJ' },
      { type: 'Journal article', topic: 'productivity', title: 'Corporate Productivity Performance: A Harmonist Framework', authors: 'Isaac Zeb-Obipi', venue: 'International Journal of Business and General Management 4(1), 19–28', year: '2015', url: 'https://scholar.google.com/citations?user=LZmm8WwAAAAJ' },
      { type: 'Journal article', topic: 'ir', title: 'Analysis of Organizational Action: The Use of Definitional and Explanatory Constructs', authors: 'Isaac Zeb-Obipi, P. Harcourt', venue: 'West African Journal of Business 9(1), 143–153', year: '2007', url: 'https://scholar.google.com/citations?user=LZmm8WwAAAAJ' },
      { type: 'Book', topic: 'book', title: 'Managing Human Resources: Basic Principles', authors: 'M. D. Tamunomiebi, I. Zeb-Obipi', venue: 'Springfield Publishers, Owerri, Nigeria', year: '2002', url: 'https://scholar.google.com/citations?user=LZmm8WwAAAAJ' }
    ],
    awards: [
      { title: 'Man of the Year & Academic Don of the Year', org: '2025 South-South Media and Entertainment Awards', year: '2025', description: 'Honoured in December 2025 for leadership, academic excellence and commitment to the development of Rivers State University.', icon: 'award', url: 'https://www.kristinareports.com/rsu-vc-honoured-with-man-of-the-year-academic-don-of-the-year-awards' },
      { title: 'Global Diplomat Honour & Award for Diplomatic Outstanding Performance', org: 'United World Congress of Diplomats', year: '2026', description: 'Recognised for contributions to education, leadership and humanity, and invited to keynote the "African Achievers of the World" programme.', icon: 'globe', url: 'https://elanhub.net/rsu-vc-bags-global-diplomat-honour/' },
      { title: 'NANS Hall of Fame', org: 'National Association of Nigerian Students', year: '2025', description: 'Inducted into the NANS Hall of Fame; the NANS Executive Council also announced his nomination for a national award at its 45th anniversary.', icon: 'users', url: 'https://myschoolnews.ng/rsu-vc-receives-nans-executive-council-pledges-commitment-to-student-welfare' },
      { title: 'Honoured by the Ogoloma Kingdom', org: 'Ancient Ogoloma Kingdom, Okrika', year: '2026', description: 'Received by the Amayanabo of Ogoloma and fellow monarchs in recognition of his appointment as Vice-Chancellor and his contributions to the community.', icon: 'star', url: 'https://businessday.ng/news/article/rivers-varsity-vc-finds-honour-at-home-honoured-by-ogoloma-monarch/' },
      { title: 'Outstanding Supporter of the Port Harcourt Arsenal Community', org: 'Port Harcourt Arsenal Community', year: '2026', description: 'Presented during the Nigeria Arsenal Converge 2026 anniversary weekend in Port Harcourt.', icon: 'star', url: 'https://www.thetidenewsonline.com/2026/08/prof-zeb-obipi-congratulates-port-harcourt-arsenal-community/' },
      { title: 'National ICT4D Award', org: 'ICT for Development, Nigeria', year: 'Earlier career', description: 'Earned as Faculty Examination Officer for leading the transition from manual to electronic management of examination results.', icon: 'award', url: 'https://www.rsu.edu.ng/vice-chancellor/' },
      { title: 'Professional Fellowships', org: 'IHNR · IMC · TAMN · CIPM', year: 'Ongoing', description: 'Fellow of the Institute of Natural and Human Resources of Nigeria; member of the Chartered Institute of Personnel Management of Nigeria, the Nigerian Institute of Management and The Academy of Management Nigeria.', icon: 'briefcase', url: 'https://rsutheatreandfilmstudies.com.ng/teams/profisaac/' },
      { title: 'Chief Ogulacha II of Ogoloma', org: 'Ogoloma, Okrika Local Government Area', year: 'Traditional title', description: 'Holds a traditional stool in his home community in addition to his academic and administrative service.', icon: 'star', url: '' }
    ],
    conferences: [
      { title: 'Annual Faith Conference: Leadership and Business Session', role: 'Keynote speaker', event: 'FirstLove Assembly, 13th Anniversary', date: 'August 2026', location: 'Rukpokwu, Port Harcourt', description: 'Keynote on leadership, headlining the leadership and business session alongside Dr Dakuku Peterside and Mrs Tina Osuji.', url: 'https://thesun.ng/dakuku-peterside-zeb-obipi-tina-osuji-to-headline-firstlove-assembly-conference/' },
      { title: 'Open and Distance Learning Centre inauguration', role: 'Inaugurating officer', event: 'Rivers State University ODL Centre', date: 'September 2026', location: 'Rivers State University, Port Harcourt', description: 'Inaugurated the governing board of the ODL Centre and described technology-enabled learning as an indispensable pathway to meet growing demand for higher education.', url: 'https://businessday.ng/life/article/rivers-varsity-bets-big-on-tech-backed-open-and-distance-learning-system/' },
      { title: 'Governing Council Retreat: Repositioning for Global Standards', role: 'Welcome address', event: 'Rivers State University Governing Council', date: 'May 2026', location: 'Port Harcourt', description: 'Set out priorities including strategic development, fundraising, industry collaboration, entrepreneurial growth, global ranking and financial accountability.', url: 'https://businessday.ng/features/article/rivers-state-university-launches-fresh-drive-for-excellence-with-governing-council-retreat/' },
      { title: 'Port Harcourt\'s Energy Journey since 1956', role: 'Keynote address', event: 'Energy Editors engagement, Port Harcourt', date: 'August 2025', location: 'Port Harcourt', description: 'Traced the city\'s energy history and made the case for recognising Port Harcourt as Nigeria\'s Premier Energy City.', url: 'https://www.rsu.edu.ng/wp-content/uploads/rsubulletin/RSU%20WEEKLY%20BULLETIN%20-%20WEEK%204.pdf' },
      { title: 'Nigerian Institute of Physics, 46th Annual Conference', role: 'Chief host, welcome address', event: 'Nigerian Institute of Physics', date: '13 May 2025', location: 'Rivers State University, Port Harcourt', description: 'Welcomed delegates and affirmed physics as a cornerstone of national development; keynote by the NASENI chief executive.', url: 'https://www.kristinareports.com/rsu-hosts-nigerian-institute-of-physics-46th-annual-conference-champions-role-of-physics-in-national-development' },
      { title: 'NIIRA 2025', role: 'Host', event: 'Hosted at Rivers State University', date: '2025', location: 'Rivers State University, Port Harcourt', description: 'Welcomed participants as host institution; remembered by guests as an "amiable host".', url: '' },
      { title: '79th Inaugural Lecture', role: 'Inaugural lecturer', event: 'Rivers State University', date: '27 July 2022', location: 'University Senate Chamber, Port Harcourt', description: 'Delivered "People Management Tripod and Worker Productivity" and proposed a Department of Human Resource Management and Industrial Relations.', url: 'https://www.rsu.edu.ng/wp-content/uploads/2022/08/79-lecture-July-2022.pdf' }
    ],
    session_types: [
      { key: 'in_person', label: 'In-person meeting', icon: 'users', description: 'A face-to-face conversation at the Vice-Chancellor\'s office, Rivers State University, Nkpolu-Oroworukwo.', durations: '30,45,60', location_hint: 'Office of the Vice-Chancellor, RSU Main Campus', flexible: false, enabled: true },
      { key: 'video', label: 'Video meeting', icon: 'video', description: 'Meet from anywhere. A Google Meet or Zoom link is shared once your request is approved.', durations: '30,45', location_hint: 'Link sent after approval', flexible: false, enabled: true },
      { key: 'phone', label: 'Phone call', icon: 'phone', description: 'A short, focused call. The number to expect is shared once your request is approved.', durations: '15,30', location_hint: 'Call details sent after approval', flexible: false, enabled: true },
      { key: 'mentorship', label: 'Mentorship and academic guidance', icon: 'graduation', description: 'For students, researchers and early-career academics seeking direction on study, research or career. Choose your preferred format in the next step.', durations: '30,45,60', location_hint: 'Format agreed on approval', flexible: true, enabled: true },
      { key: 'invitation', label: 'Speaking or event invitation', icon: 'mic', description: 'Invite him to speak, chair or grace an event. Share the details and he will respond personally.', durations: '30', location_hint: 'Discussion format agreed on approval', flexible: true, enabled: true }
    ]
  }
};
