// ============================================================
// IN-MEMORY VECTOR STORE WITH TF-IDF + COSINE SIMILARITY
// Simple RAG system for the Multi Debate Agent System AI debate platform.
// Uses TF-IDF style vectorization — no external dependencies.
//
// Vectors are computed lazily on search to ensure a consistent
// vocabulary and IDF across all documents.
// ============================================================

// ---- Types ----

export interface Document {
  id: string;
  content: string;
  metadata: Record<string, string>;
}

interface InternalDocument extends Document {
  tokens: string[];
}

interface SearchResult {
  document: Document;
  score: number;
}

interface KnowledgeEntry {
  content: string;
  category: string;
  tags?: string[];
}

// ---- Stop words ----

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
  "be", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "can", "shall", "not", "no", "this",
  "that", "these", "those", "it", "its", "he", "she", "they", "them",
  "we", "us", "my", "his", "her", "our", "their", "who", "which", "what",
  "when", "where", "how", "why", "all", "each", "every", "both", "few",
  "more", "most", "other", "some", "such", "than", "too", "very", "also",
  "just", "about", "up", "out", "if", "then", "so", "into", "over",
  "after", "before", "between", "under", "again", "further", "once",
  "here", "there", "any", "only", "own", "same", "above", "below",
  "through", "during", "while", "because", "being", "having", "doing",
  "am",
]);

// ---- Pre-loaded Indian legal & debate knowledge ----

const LEGAL_KNOWLEDGE: KnowledgeEntry[] = [
  // ============================================================
  // CONSTITUTIONAL LAW (Articles 12-35)
  // ============================================================
  {
    content:
      "Article 14: Right to Equality — The State shall not deny any person equality before the law or equal protection of the laws within the territory of India. Applied in E.P. Royappa v. State of Tamil Nadu (1974) where the Supreme Court held that arbitrary action is antithesis of equality. The test is whether classification is reasonable and bears a rational nexus with the object sought. Also invoked in Navtej Singh Johar v. Union of India (2018) to strike down Section 377 IPC.",
    category: "constitutional",
    tags: ["equality", "article 14", "classification", "arbitrariness"],
  },
  {
    content:
      "Article 19(1)(a): Freedom of Speech and Expression — All citizens have the right to freedom of speech and expression. Subject to reasonable restrictions under Article 19(2) relating to sovereignty, security, public order, decency, morality, contempt of court, defamation, and incitement. In Shreya Singhal v. Union of India (2015), Section 66A IT Act was struck down as unconstitutional for being vague and overbroad. Romesh Thappar v. State of Madras (1950) established that free speech is the foundation of democratic society.",
    category: "constitutional",
    tags: ["speech", "expression", "article 19", "freedom", "restriction"],
  },
  {
    content:
      "Article 21: Right to Life and Personal Liberty — No person shall be deprived of life or personal liberty except according to procedure established by law. The Supreme Court has expansively interpreted this to include: right to privacy (K.S. Puttaswamy v. Union of India, 2017), right to livelihood (Olga Tellis v. Bombay Municipal Corporation, 1985), right to clean environment (M.C. Mehta v. Union of India, 1987), right to education (Mohini Jain v. State of Karnataka, 1992), right to health (Paschim Banga Khet Mazdoor Samity v. State of West Bengal, 1996), and right to sleep (Ramlila Maidan v. Home Secretary, 2012).",
    category: "constitutional",
    tags: ["life", "liberty", "article 21", "privacy", "fundamental rights"],
  },
  {
    content:
      "Article 22: Protection Against Arrest and Detention — Provides safeguards against arbitrary arrest: right to be informed of grounds of arrest (Article 22(1)), right to consult and be defended by a lawyer of choice (Article 22(1)), right to be produced before a magistrate within 24 hours (Article 22(2)). These are not available to enemy aliens and persons detained under preventive detention laws. In D.K. Basu v. State of West Bengal (1997), the Supreme Court laid down guidelines for arrest and custodial violence.",
    category: "constitutional",
    tags: ["arrest", "detention", "article 22", "custodial rights", "bail"],
  },
  {
    content:
      "Article 25: Freedom of Religion — Subject to public order, morality, health, and other fundamental rights. Guarantees freedom of conscience and free profession, practice, and propagation of religion. In S.R. Bommai v. Union of India (1994), the Supreme Court held that secularism is a basic feature of the Constitution. The Sabarimala case (Indian Young Lawyers Association v. State of Kerala, 2018) tested the limits of religious freedom against equality.",
    category: "constitutional",
    tags: ["religion", "secularism", "article 25", "freedom of conscience"],
  },
  {
    content:
      "Article 32: Right to Constitutional Remedies — Dr. Ambedkar called it the 'heart and soul' of the Constitution. It gives the Supreme Court power to issue writs (habeas corpus, mandamus, prohibition, certiorari, quo warranto) for enforcement of fundamental rights. Article 226 gives High Courts broader writ jurisdiction. In Vishaka v. State of Rajasthan (1997), the Supreme Court laid down guidelines against sexual harassment using Article 32 powers.",
    category: "constitutional",
    tags: ["writs", "remedies", "article 32", "supreme court", "habeas corpus"],
  },
  {
    content:
      "Basic Structure Doctrine — Established in Kesavananda Bharati v. State of Kerala (1973), the Supreme Court held that Parliament cannot amend the basic structure of the Constitution. Components include: supremacy of the Constitution, rule of law, separation of powers, judicial review, federalism, secularism, democracy, and fundamental rights. In Minerva Mills v. Union of India (1980), the doctrine was reaffirmed. The doctrine acts as a check on parliamentary power.",
    category: "constitutional",
    tags: ["basic structure", "amendment", "constituent power", "judicial review"],
  },
  {
    content:
      "Fundamental Duties under Article 51A — Added by the 42nd Amendment (1976) on Swaran Singh Committee recommendation. Though non-justiciable, they serve as a reminder of civic responsibility. Key duties include: abiding by the Constitution, cherishing national symbols, defending the country, promoting harmony, preserving heritage, protecting the environment, developing scientific temper, safeguarding public property, and striving for excellence. In R.R. Gopal v. State of Tamil Nadu (1998), the Court discussed their role.",
    category: "constitutional",
    tags: ["fundamental duties", "51A", "civic responsibility", "42nd amendment"],
  },
  {
    content:
      "Public Interest Litigation (PIL) — Evolved in India through S.P. Gupta v. Union of India (1981) and expanded in PUDR v. Union of India (1982). The Supreme Court relaxed locus standi rules to allow any public-spirited person to file on behalf of the disadvantaged. Used extensively for environmental protection (M.C. Mehta cases), bonded labour, custodial violence, and governance reform. However, in State of Uttaranchal v. Balwant Singh Chaufal (2010), the Court cautioned against PIL abuse and laid down guidelines to prevent frivolous petitions.",
    category: "constitutional",
    tags: ["PIL", "public interest", "locus standi", "judicial activism", "social justice"],
  },
  {
    content:
      "Article 19(1)(g): Right to Practice any Profession — Subject to reasonable restrictions under Article 19(6). The State may impose professional qualifications and regulations. In Unni Krishnan v. State of A.P. (1993), the Supreme Court held that citizens have a right to establish and run educational institutions, but this is not absolute. In Indian Medical Association v. Union of India, regulations on medical practice were upheld. The tension between professional freedom and public interest is a recurring theme in Indian constitutional law.",
    category: "constitutional",
    tags: ["profession", "19(1)(g)", "right to trade", "regulation", "freedom"],
  },

  // ============================================================
  // CRIMINAL LAW (IPC / BNS)
  // ============================================================
  {
    content:
      "Section 302 IPC (now Section 103 BNS): Punishment for Murder — Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine. The Supreme Court in Bachan Singh v. State of Punjab (1980) established the 'rarest of rare' doctrine for imposing the death penalty — it must be imposed only when the alternative option is unquestionably foreclosed. In Machhi Singh v. State of Punjab (1983), the Court identified aggravating circumstances.",
    category: "criminal",
    tags: ["murder", "302", "death penalty", "rarest of rare", "punishment"],
  },
  {
    content:
      "Section 498A IPC (now Section 85 BNS): Cruelty by Husband or Relatives — Deals with cruelty towards a married woman by her husband or his relatives. Cruelty includes both physical harm and mental cruelty likely to drive the woman to suicide or cause grave injury. The Supreme Court in Rajesh Sharma v. State of U.P. (2017) noted misuse concerns and suggested safeguards. In Sushil Kumar Sharma v. Union of India (2005), the Court held that mere harassment without specific allegations does not attract 498A.",
    category: "criminal",
    tags: ["498A", "cruelty", "dowry", "domestic violence", "husband"],
  },
  {
    content:
      "Section 376 IPC (now Section 63 BNS): Punishment for Rape — Provides for a minimum of 10 years rigorous imprisonment which may extend to life imprisonment and fine. After the Nirbhaya case (2012), the Criminal Law (Amendment) Act 2013 expanded the definition of rape, added new offences, and increased minimum sentences. The Justice Verma Committee recommended comprehensive reforms. In Mukesh & Anr v. NCT of Delhi (2017), the Supreme Court upheld the death penalty in rare cases.",
    category: "criminal",
    tags: ["rape", "376", "sexual offence", "nirbhaya", "consent"],
  },
  {
    content:
      "Section 420 IPC (now Section 316 BNS): Cheating and Dishonestly Inducing Delivery of Property — Punishable with imprisonment up to 7 years and fine. The essential ingredients are: (1) deception, (2) fraudulent or dishonest inducement, and (3) delivery of property or consent to retain it. In S.P. Chengalvaraya Naidu v. Jagannath (1994), the Supreme Court held that fraud vitiates all acts. Cheating is a cognizable and bailable offence.",
    category: "criminal",
    tags: ["cheating", "420", "fraud", "deception", "property"],
  },
  {
    content:
      "Section 304B IPC (now Section 80 BNS): Dowry Death — If a woman dies by burns, bodily injury, or unnatural circumstances within 7 years of marriage, and it is shown she was subjected to cruelty or harassment by husband/relatives in connection with dowry demand, the death shall be called 'dowry death'. Punishment is minimum 7 years imprisonment, extendable to life. In Appasaheb v. State of Maharashtra (2007), the Court held that presumption under Section 113B Evidence Act applies once the basic facts are established.",
    category: "criminal",
    tags: ["dowry death", "304B", "dowry", "cruelty", "marriage"],
  },
  {
    content:
      "Self-Defence under IPC Section 96-106 (BNS Sections 34-43) — The right of private defence is available when there is a reasonable apprehension of danger. The right extends to causing death under Section 100/104 when the assault causes reasonable apprehension of death or grievous hurt. In Darshan Singh v. State of Punjab (2010), the Supreme Court clarified that the right of self-defence is available even against an unlawful assembly. There is no right of private defence against acts of public servants acting in good faith under colour of office.",
    category: "criminal",
    tags: ["self defence", "private defence", "96", "100", "justification"],
  },

  // ============================================================
  // CRIMINAL PROCEDURE CODE (CrPC / BNSS)
  // ============================================================
  {
    content:
      "Section 41 CrPC (now Section 35 BNSS): When Police May Arrest Without Warrant — A police officer may arrest without a warrant a person who has committed a cognizable offence, or against whom a reasonable complaint exists, or who is a proclaimed offender. In Arnesh Kumar v. State of Bihar (2014), the Supreme Court mandated that for offences with punishment up to 7 years, police must provide reasons in writing for arrest and cannot arrest automatically. This was to prevent unnecessary arrests.",
    category: "criminal procedure",
    tags: ["arrest", "41", "police", "warrant", "cognizable"],
  },
  {
    content:
      "Section 125 CrPC (now Section 144 BNSS): Maintenance of Wives, Children, and Parents — Provides for monthly maintenance not exceeding ₹5,000 (or as prescribed). The court may order maintenance if the person with sufficient means neglects or refuses to maintain: wife unable to maintain herself, legitimate or illegitimate minor child, or father or mother unable to maintain themselves. In Rajnesh v. Neha (2020), the Supreme Court laid down a uniform framework for maintenance proceedings across personal laws.",
    category: "criminal procedure",
    tags: ["maintenance", "125", "family", "alimony", "wife"],
  },
  {
    content:
      "Section 164 CrPC (now Section 180 BNSS): Recording of Confessions and Statements — A magistrate (not a police officer) must record confessions. The accused must be cautioned that he is not bound to make a confession and that it may be used against him. In State v. Narsingrao (2015), the Supreme Court held that a confession recorded by a magistrate must be voluntary and free from coercion. Section 164(4) provides for recording dying declarations.",
    category: "criminal procedure",
    tags: ["confession", "164", "magistrate", "statement", "dying declaration"],
  },
  {
    content:
      "Anticipatory Bail under Section 438 CrPC — A person who has reason to believe that he may be arrested on an accusation of a non-bailable offence may apply to the High Court or Court of Session for direction to grant bail. In Sushila Aggarwal v. State of NCT (2020), the Supreme Court held that protection under Section 438 should not be limited to a fixed period. The court considers factors like the nature of the offence, antecedents, and likelihood of the applicant fleeing from justice.",
    category: "criminal procedure",
    tags: ["anticipatory bail", "438", "bail", "pre-arrest", "non-bailable"],
  },
  {
    content:
      "Section 311 CrPC: Power to Summon Material Witness — The court may at any stage summon any person as a witness or examine any person in attendance if his evidence appears essential to the just decision of the case. This is a powerful tool to ensure that material evidence is not suppressed. In Zahoor Hussain Bhatti v. State of U.P. (1981), the Supreme Court held that Section 311 should be liberally interpreted to arrive at the truth. The section reflects the principle that criminal trials are not battles between adversaries but a quest for truth.",
    category: "criminal procedure",
    tags: ["witness", "311", "summons", "evidence", "court power", "truth"],
  },

  // ============================================================
  // EVIDENCE ACT
  // ============================================================
  {
    content:
      "Section 65B Indian Evidence Act: Admissibility of Electronic Records — Electronic records are admissible as evidence if the conditions of Section 65B(2) are satisfied and a certificate under Section 65B(4) is produced. The computer output must have been produced during regular course of activities. In Anvar P.V. v. P.K. Basheer (2014), the Supreme Court held that Section 65B certificate is mandatory for electronic evidence and secondary evidence cannot be relied upon without it. This applies to emails, CCTV footage, digital documents, and social media posts.",
    category: "evidence",
    tags: ["electronic evidence", "65B", "digital", "computer", "certificate"],
  },
  {
    content:
      "Section 27 Indian Evidence Act: Discovery Based on Accused's Statement — When any fact is deposed to as discovered in consequence of information received from a person accused of any offence in the custody of a police officer, so much of that information as relates distinctly to the fact thereby discovered may be proved. This is an exception to Section 25 (confession to police not admissible) and Section 26 (confession in police custody not admissible). Used extensively in recovery cases (e.g., recovery of weapon, stolen property).",
    category: "evidence",
    tags: ["discovery", "27", "accused statement", "recovery", "confession"],
  },
  {
    content:
      "Section 114 Evidence Act (Illustration g): Presumption of Abetment — When a woman commits suicide within 7 years of marriage and her husband or relatives subjected her to cruelty, the court may presume abetment of suicide under Section 306 IPC. This presumption is rebuttable — the burden shifts to the accused to prove absence of cruelty. In Gurbachan Singh v. State of Punjab (1980), the Supreme Court held that mere harassment is insufficient; there must be a proximate link between cruelty and suicide.",
    category: "evidence",
    tags: ["presumption", "114", "abetment", "suicide", "cruelty", "burden of proof"],
  },
  {
    content:
      "Burden of Proof — Under Section 101 Evidence Act, the burden of proof lies on the person who would fail if no evidence is given. In criminal cases, the prosecution bears the burden to prove guilt beyond reasonable doubt (Section 101 read with presumption of innocence). In Satyabrata Ghosh v. Mugneeram Bangur (1954), the Supreme Court held that in civil cases, preponderance of probabilities suffices. Section 106 imposes a limited burden on the accused to prove facts within special knowledge.",
    category: "evidence",
    tags: ["burden of proof", "101", "beyond reasonable doubt", "preponderance"],
  },

  // ============================================================
  // TECHNOLOGY LAW (IT Act 2000, DPDP Act 2023)
  // ============================================================
  {
    content:
      "Information Technology Act 2000 — India's primary cyber law enacted based on the UNCITRAL Model Law. Key provisions: Section 43 (penalty for data theft/unauthorized access), Section 43A (compensation for failure to protect sensitive personal data), Section 66 (hacking with imprisonment up to 3 years), Section 66A (criminalizing offensive online messages — STRUCK DOWN in Shreya Singhal 2015), Section 66C (identity theft), Section 66D (cheating by impersonation using computer), Section 67 (publishing obscene material electronically), Section 69 (government interception powers).",
    category: "tech law",
    tags: ["IT Act", "cyber law", "hacking", "2000", "UNCITRAL"],
  },
  {
    content:
      "Digital Personal Data Protection Act 2023 (DPDPA) — India's comprehensive data protection law. Key features: (1) Consent-based processing as the default (Section 6), (2) Data fiduciary obligations including notice, purpose limitation, and data minimization (Section 7-8), (3) Rights of data principals — right to access, correction, erasure, grievance redressal (Section 11-14), (4) Special protections for children's data (Section 9), (5) Cross-border data transfer restrictions (Section 16), (6) Penalty up to ₹250 crore for violations (Section 28-29), (7) Exemptions for state security and research. Implements recommendations of the Justice B.N. Srikrishna Committee (2018).",
    category: "tech law",
    tags: ["DPDP", "data protection", "privacy", "consent", "2023", "data fiduciary"],
  },
  {
    content:
      "Section 66C IT Act: Identity Theft — Whoever fraudulently or dishonestly makes use of the electronic signature, password or any other unique identification feature of any other person shall be punishable with imprisonment up to 3 years and fine. In R.K. Dalmia v. Delhi Administration, identity theft through phishing, SIM swapping, or creating fake profiles attracts this section. Combined with Section 420 IPC for cheating, prosecutors often invoke both sections.",
    category: "tech law",
    tags: ["identity theft", "66C", "phishing", "fraud", "electronic signature"],
  },
  {
    content:
      "Section 69A IT Act: Blocking Powers — The government may direct any intermediary to block access to any information resource for reasons of sovereignty, defence, security, public order, or incitement. Implemented through the IT (Procedure and Safeguards for Blocking) Rules 2009. In Shreya Singhal v. Union of India (2015), the Supreme Court upheld Section 69A but required procedural safeguards including hearing the intermediary. Used for blocking websites, apps, and social media content.",
    category: "tech law",
    tags: ["blocking", "69A", "internet shutdown", "intermediary", "government power"],
  },
  {
    content:
      "Intermediary Liability under Section 79 IT Act — Intermediaries (social media platforms, ISPs, hosting providers) are not liable for third-party content if they: (1) do not initiate the transmission, (2) do not select the receiver, and (3) exercise due diligence and comply with government orders. The IT (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021 imposed additional obligations including grievance officers, traceability requirements, and content takedown timelines (36 hours for court orders, 24 hours for government orders).",
    category: "tech law",
    tags: ["intermediary", "79", "safe harbour", "platform liability", "due diligence"],
  },
  {
    content:
      "Cybercrime Investigation and Digital Forensics — Indian cybercrime investigation involves: (1) First Information Report (FIR) registration under relevant IPC/IT Act sections, (2) Preservation of digital evidence under Section 65B Evidence Act, (3) Forensic analysis by CERT-In certified labs, (4) IP tracking and server logs examination, (5) Social media interception under Section 69 IT Act. The Indian Cyber Crime Coordination Centre (I4C) was established in 2018. Challenges include: jurisdiction across states/countries, encryption, anonymity tools (VPN, Tor), and rapid data deletion.",
    category: "tech law",
    tags: ["cybercrime", "forensics", "CERT-In", "digital evidence", "investigation"],
  },

  // ============================================================
  // AI REGULATION & EMERGING TECH LAW
  // ============================================================
  {
    content:
      "India's AI Regulation Approach — India does not yet have a dedicated AI law. The government's approach is sector-specific and principles-based. NITI Aayog's 2018 National Strategy for AI identified five focus areas: healthcare, agriculture, education, smart cities, and mobility. The Ministry of Electronics and IT (MeitY) issued an advisory in March 2024 requiring AI models to seek government approval before deployment and to label AI-generated content. The Digital India Act (draft) may comprehensively regulate AI. India co-sponsored the UN resolution on AI (2024) promoting safe, secure, and trustworthy AI.",
    category: "ai law",
    tags: ["AI regulation", "NITI Aayog", "MeitY", "Digital India Act", "policy"],
  },
  {
    content:
      "AI Liability and Legal Issues — Key legal challenges: (1) Who is liable when AI causes harm — developer, deployer, or user? The EU AI Act (2024) adopts a risk-based framework with strict liability for high-risk systems. (2) AI and intellectual property — can AI-generated works be copyrighted? (3) Algorithmic bias and discrimination — Article 14 challenges. (4) Deepfakes and misinformation — IT Act Section 66D and 69A. (5) AI in criminal justice — concerns about predictive policing violating Article 21. (6) Workplace automation and labour law implications.",
    category: "ai law",
    tags: ["AI liability", "bias", "deepfakes", "copyright", "EU AI Act"],
  },
  {
    content:
      "AI Ethics Principles — Widely accepted frameworks include: (1) Transparency and Explainability — users should know when they interact with AI, (2) Fairness and Non-discrimination — AI should not perpetuate biases, (3) Privacy and Data Governance — AI must comply with data protection laws, (4) Accountability — clear responsibility chains for AI outcomes, (5) Safety and Robustness — AI systems should be secure and reliable, (6) Human Oversight — meaningful human control over AI decisions. India's Responsible AI for Youth initiative promotes these principles. The IEEE Ethically Aligned Design and UNESCO's AI Ethics Recommendation provide global standards.",
    category: "ai law",
    tags: ["AI ethics", "transparency", "fairness", "accountability", "UNESCO"],
  },
  {
    content:
      "Deepfakes and Synthetic Media Law — Deepfakes raise legal issues under: (1) IT Act Section 66C (identity theft), Section 66D (cheating by impersonation), Section 67 (obscenity), (2) IPC Section 499 (defamation) and Section 503 (criminal intimidation), (3) Copyright Act for unauthorized use of likeness, (4) DPDPA 2023 for processing biometric data. The IT Rules 2021 require intermediaries to remove deepfake content expeditiously. MeitY's November 2023 advisory made it mandatory to label AI-generated content. The Delhi High Court in various cases has recognized deepfake pornography as a serious offence.",
    category: "ai law",
    tags: ["deepfakes", "synthetic media", "impersonation", "defamation", "biometric"],
  },
  {
    content:
      "AI in the Indian Judiciary — The Supreme Court's SUPACE (Supreme Court Portal for Assistance in Court Efficiency) uses AI for case categorization and research. The e-Courts project digitizes court records. AI tools help in: legal research (faster case law retrieval), document analysis (contract review), predictive analytics (case outcome prediction), and translation. However, concerns include: algorithmic bias in sentencing recommendations, lack of transparency in AI decisions, data privacy of litigants, and the need for human judicial discretion. The Chief Justice of India has emphasized that AI must assist, not replace, judges.",
    category: "ai law",
    tags: ["AI judiciary", "SUPACE", "e-courts", "legal tech", "automation"],
  },

  // ============================================================
  // DEBATE STRATEGY & RHETORIC
  // ============================================================
  {
    content:
      "Classical Rhetoric: Ethos, Pathos, Logos — The three modes of persuasion identified by Aristotle. Ethos: credibility of the speaker — establish authority, demonstrate fairness, show expertise. Pathos: emotional appeal — use vivid language, tell stories, appeal to values and fears. Logos: logical argument — present evidence, use syllogisms, construct valid reasoning chains. Effective debaters blend all three. In legal arguments, logos dominates but ethos (lawyer's reputation) and pathos (victim impact) play crucial roles. The Supreme Court of India often balances all three in constitutional interpretation.",
    category: "debate strategy",
    tags: ["rhetoric", "ethos", "pathos", "logos", "persuasion", "aristotle"],
  },
  {
    content:
      "Debate Strategies: Constructive vs. Rebuttal — Constructive arguments build your case: define terms, state your thesis, present evidence, and draw conclusions. Use the CREAC method: Conclusion, Rule, Explanation, Application, Conclusion. Rebuttal attacks opponents: identify logical fallacies (straw man, ad hominem, false dichotomy, slippery slope, appeal to authority, begging the question), challenge evidence quality, expose inconsistencies, and offer counter-examples. In Indian legal practice, both are essential — pleading (constructive) and cross-examination (rebuttal).",
    category: "debate strategy",
    tags: ["debate", "rebuttal", "constructive", "fallacies", "CREAC", "argument"],
  },
  {
    content:
      "Legal Argumentation Techniques — Key methods: (1) Stare decisis — following binding precedents; distinguish unfavourable cases on facts. (2) Literal rule vs. purposive interpretation — literal follows text, purposive considers legislative intent (used extensively in Indian constitutional law). (3) Golden rule — modify literal meaning to avoid absurd results. (4) Mischief rule — interpret to suppress the mischief the Act was intended to remedy (Heydon's Case 1584). (5) Harmonious construction — reconcile conflicting provisions. (6) Doctrine of pith and substance — determine the true nature of legislation. (7) Res judicata — prevent re-litigation of settled matters.",
    category: "debate strategy",
    tags: ["legal argument", "precedent", "interpretation", "stare decisis", "purposive"],
  },
  {
    content:
      "Counter-Argument Frameworks — When opposing a position: (1) Challenge the premise — is the foundational claim true? (2) Attack the reasoning — is the logical connection valid? (3) Question the evidence — is the data reliable and relevant? (4) Offer alternative explanations — could the same facts lead to different conclusions? (5) Demonstrate trade-offs — what is sacrificed for the proposed benefit? (6) Use reductio ad absurdum — extend the argument to its logical extreme. (7) Cite authoritative counter-examples. (8) Highlight unintended consequences. In Indian constitutional debates, these techniques are frequently used by both petitioners and the State.",
    category: "debate strategy",
    tags: ["counter argument", "logic", "reasoning", "rebuttal", "framework"],
  },
  {
    content:
      "Structuring a Winning Debate Speech — Open with a hook (startling statistic, rhetorical question, or compelling story). State your thesis clearly in one sentence. Preview your main points. Develop 2-3 strong arguments with evidence and examples. Address and pre-empt counter-arguments. Use signposting ('First', 'Moreover', 'However', 'Therefore'). Close with a powerful conclusion that reinforces your thesis and leaves a lasting impression. Time management is critical — allocate more time to your strongest points. In Indian parliamentary debates, structure often follows: introduction, statement of facts, legal provisions, case law, analysis, and prayer for relief.",
    category: "debate strategy",
    tags: ["speech structure", "debate format", "public speaking", "conclusion", "evidence"],
  },
  {
    content:
      "Common Logical Fallacies in Legal Debates — (1) Ad hominem: attacking the person, not the argument. (2) Straw man: misrepresenting the opponent's position. (3) Appeal to authority: citing authority without examining the reasoning. (4) False dichotomy: presenting only two options when more exist. (5) Slippery slope: claiming one step inevitably leads to extreme outcomes without evidence. (6) Circular reasoning: the conclusion is assumed in the premise. (7) Hasty generalization: drawing broad conclusions from insufficient evidence. (8) Post hoc ergo propter hoc: assuming causation from correlation. Indian courts, especially the Supreme Court, actively identify and reject these in judgments.",
    category: "debate strategy",
    tags: ["fallacies", "logical errors", "ad hominem", "straw man", "critical thinking"],
  },
];

// ---- Vector Store Implementation ----

export class VectorStore {
  private documents: InternalDocument[] = [];
  private dirty = true;

  // Cached index data (rebuilt when dirty)
  private _vocab: string[] = [];
  private _idf: Float64Array = new Float64Array(0);
  private _docVectors: Float64Array[] = [];

  addDocument(
    id: string,
    content: string,
    metadata?: Record<string, string>
  ): void {
    const tokens = this.tokenize(content);
    this.documents.push({ id, content, metadata: metadata ?? {}, tokens });
    this.dirty = true;
  }

  search(query: string, topK: number = 5): SearchResult[] {
    if (this.documents.length === 0) return [];
    this.rebuildIndex();

    const queryTokens = this.tokenize(query);
    const queryVector = this.computeVector(queryTokens);

    const results: SearchResult[] = [];
    for (let i = 0; i < this.documents.length; i++) {
      const score = this.cosineSimilarity(queryVector, this._docVectors[i]);
      if (score > 0) {
        results.push({ document: this.documents[i], score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  searchByCategory(
    query: string,
    category: string,
    topK: number = 5
  ): SearchResult[] {
    if (this.documents.length === 0) return [];
    this.rebuildIndex();

    const queryTokens = this.tokenize(query);
    const queryVector = this.computeVector(queryTokens);

    const results: SearchResult[] = [];
    for (let i = 0; i < this.documents.length; i++) {
      if (this.documents[i].metadata.category !== category) continue;
      const score = this.cosineSimilarity(queryVector, this._docVectors[i]);
      if (score > 0) {
        results.push({ document: this.documents[i], score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  getContext(query: string, maxTokens: number = 2000): string {
    const results = this.search(query, 5);
    if (results.length === 0) return "";

    const passages: string[] = [];
    let currentLength = 0;

    for (const { document, score } of results) {
      const tokenCount = document.content.split(/\s+/).length;
      if (currentLength + tokenCount > maxTokens) break;

      passages.push(
        `[Relevance: ${(score * 100).toFixed(0)}%] ${document.content}`
      );
      currentLength += tokenCount;
    }

    if (passages.length === 0) return "";

    return `--- Relevant Knowledge Context ---\n${passages.join("\n\n")}\n--- End Context ---`;
  }

  getDocumentCount(): number {
    return this.documents.length;
  }

  getAllCategories(): string[] {
    const cats = new Set<string>();
    for (const doc of this.documents) {
      if (doc.metadata.category) cats.add(doc.metadata.category);
    }
    return Array.from(cats).sort();
  }

  // ---- Tokenization ----

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
  }

  // ---- Index Building (lazy, rebuilt on search after adds) ----

  private rebuildIndex(): void {
    if (!this.dirty) return;
    this.dirty = false;

    // Build vocabulary from all documents
    const vocabSet = new Set<string>();
    for (const doc of this.documents) {
      for (const t of doc.tokens) vocabSet.add(t);
    }
    this._vocab = Array.from(vocabSet).sort();
    const vocabSize = this._vocab.length;

    // Build term → index map
    const termIndex = new Map<string, number>();
    for (let i = 0; i < vocabSize; i++) {
      termIndex.set(this._vocab[i], i);
    }

    // Compute IDF: log(N / df) + 1
    const N = this.documents.length;
    const df = new Float64Array(vocabSize);
    for (const doc of this.documents) {
      const seen = new Set<string>();
      for (const t of doc.tokens) {
        if (!seen.has(t)) {
          seen.add(t);
          const idx = termIndex.get(t);
          if (idx !== undefined) df[idx]++;
        }
      }
    }
    this._idf = new Float64Array(vocabSize);
    for (let i = 0; i < vocabSize; i++) {
      this._idf[i] = Math.log(N / df[i]) + 1;
    }

    // Pre-compute document vectors
    this._docVectors = this.documents.map((doc) =>
      this.computeVectorFromTokens(doc.tokens)
    );
  }

  private computeVector(tokens: string[]): Float64Array {
    return this.computeVectorFromTokens(tokens);
  }

  private computeVectorFromTokens(tokens: string[]): Float64Array {
    const vocabSize = this._vocab.length;
    const vec = new Float64Array(vocabSize);

    // Term frequency
    const tf = new Map<string, number>();
    for (const t of tokens) {
      tf.set(t, (tf.get(t) ?? 0) + 1);
    }

    // TF-IDF
    for (let i = 0; i < vocabSize; i++) {
      const term = this._vocab[i];
      const termFreq = tf.get(term) ?? 0;
      vec[i] = termFreq * this._idf[i];
    }

    // L2 normalize
    let norm = 0;
    for (let i = 0; i < vocabSize; i++) norm += vec[i] * vec[i];
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < vocabSize; i++) vec[i] /= norm;
    }

    return vec;
  }

  // ---- Cosine Similarity ----

  private cosineSimilarity(a: Float64Array, b: Float64Array): number {
    if (a.length !== b.length) return 0;

    let dot = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
    }

    // Both vectors are already L2-normalized, so dot product = cosine similarity
    return dot;
  }
}

// ---- Singleton Knowledge Base ----

export const knowledgeBase: VectorStore = new VectorStore();

// Initialize with pre-loaded entries
for (let i = 0; i < LEGAL_KNOWLEDGE.length; i++) {
  const entry = LEGAL_KNOWLEDGE[i];
  knowledgeBase.addDocument(`kb-${i}`, entry.content, {
    category: entry.category,
    ...(entry.tags ? { tags: entry.tags.join(", ") } : {}),
  });
}