import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { generateIcfcIdWithModel } from '../src/utils/id-generator';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Get admin credentials from environment variables with fallbacks
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@isiolocityfc.com';
  const adminPassword = process.env.ADMIN_PASSWORD || '@admin123';
  const adminName = process.env.ADMIN_NAME || 'Admin';

  // Warn if using default credentials
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.log('WARNING: Using default admin credentials!');
    console.log('Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables for production.');
    console.log('');
  }

  // Create admin user
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: passwordHash,
      name: adminName,
      role: 'ADMIN',
      membershipTier: 'FREE',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('Admin user created successfully');
  console.log(`Email: ${adminEmail}`);
  console.log('Role: ADMIN');
  console.log('IMPORTANT: Change the password after first login!');
  console.log('');

  // Create Article 1: Coach Abu Preseason
  const article1 = await prisma.article.upsert({
    where: { slug: 'big-test-ahead-go-for-coach-abu-preseason-begins' },
    update: {},
    create: {
      id: generateIcfcIdWithModel('article'),
      title: 'Big Test Ahead: Go for Coach Abu as Isiolo City FC Pre-Season Begins',
      slug: 'big-test-ahead-go-for-coach-abu-preseason-begins',
      content: `
As the dust settles on the previous campaign, all eyes in Isiolo are now firmly fixed on the training ground at **Wabera Stadium**. **Isiolo City Football Club — the Bulls — have officially begun preparations for the 2026/2027 season**, marking the start of a defining chapter under head coach **Abubakar Daud Tari**, fondly known as *Coach Abu* or *Abuze*.

At just **23 years old**, the FKF-trained tactician is already commanding respect within the squad. Players speak highly of his energy, discipline, and clarity of ideas — qualities that reflect both his football journey and his academic background. Currently on a **five-year contract**, Coach Abu represents the club's long-term vision built on **youth development, structure, and ambition**.

## From Prolific Forward to the Touchline

Before turning to coaching, Abu enjoyed a notable playing career as an attacking player. He was prolific at **Kilifi All Stars (Division Two)**, scoring an impressive **21 goals in 20 matches**, before moving to **Malindi Progressive (Division One)**, where he contributed **2 goals and 8 assists**.

His football foundation was laid at youth level with **Isiolo Youth** and **Taqwa**, where his talent and work ethic stood out early. Even while pursuing a **degree in Veterinary Medicine at Pwani University**, Abu remained influential on the pitch, scoring **18 goals for the university team** — a clear demonstration of his discipline and commitment.

## A Turning Point That Changed Everything

Tragically, Abu's playing career was cut short while traveling to the **Inter-University Games finals in Eldoret**. He was involved in the widely known **Pwani University bus accident**, a devastating incident that claimed the lives of more than half of his teammates.

Abu survived with a broken leg, but the injury brought his playing days to an abrupt end. From that life-changing moment, he made a decisive shift toward coaching, determined to remain in the game he loved.

## Building a Modern Coach

He immediately pursued **Football Kenya Federation (FKF) coaching qualifications**, laying a strong foundation for his tactical and professional growth. Today, Coach Abu is known for his **dynamic 4-2-3-1 system**, a flexible approach that allows Isiolo City FC to adapt shape and tempo during matches.

## Pre-Season: Where Battles Are Won

As preseason unfolds, training sessions have taken on a sharper edge. Fitness levels are rising, tactical awareness is being drilled, and competition for places is fierce. No position is guaranteed, and every player is being pushed to meet the required standards.

Coach Abu's targets are clear:
- Build consistency and structure
- Develop young and local talent
- Instill a winning mentality

Looking ahead, his ambition extends beyond immediate results. He dreams of guiding Isiolo City FC to the **topmost league within five years**, while personally aiming to achieve the **CAF A License**, becoming a regional pioneer in modern coaching.

A big test lies ahead — but under **Abuze**, the Bulls are moving forward with **purpose, belief, and identity**. 🐂⚽`,
      excerpt: 'At just 23 years old, FKF-trained coach Abubakar Daud Tari leads Isiolo City FC into preseason with a compelling story of resilience, transformation, and ambition for the Bulls.',
      category: 'NEWS',
      status: 'PUBLISHED',
      featuredImageUrl: 'https://res.cloudinary.com/dzideskz7/image/upload/v1766677433/josh-power-byRCfbkd8AY-unsplash_qe4meb.jpg',
      tags: ['preseason', 'coach', 'training', 'Coach Abu', '2026-2027'],
      authorId: admin.id,
      publishedAt: new Date('2025-12-27T09:00:00Z'),
    },
  });

  console.log('✅ Article 1 created: Coach Abu Preseason');

  // Create Article 2: Town FC Friendly
  const article2 = await prisma.article.upsert({
    where: { slug: 'record-crowd-expected-isiolo-city-fc-vs-town-fc-marsabit' },
    update: {},
    create: {
      id: generateIcfcIdWithModel('article'),
      title: 'Record Crowd Expected as Isiolo City FC Face Town FC of Marsabit in Preseason Friendly',
      slug: 'record-crowd-expected-isiolo-city-fc-vs-town-fc-marsabit',
      content: `
Excitement is building across Isiolo as **Isiolo City Football Club — the Bulls — prepare to host Town FC of Marsabit** in a highly anticipated preseason friendly expected to draw a record crowd.

Though officially a friendly, the match carries significant weight. Regional pride, rivalry, and preseason momentum are all at stake as the Bulls test themselves against strong opposition.

Town FC arrive with a reputation for physical strength and tactical discipline, providing the perfect challenge for Isiolo City FC at this stage of preparation. For head coach Abubakar Daud Tari, the fixture offers a valuable opportunity to assess fitness levels, tactical execution, and squad depth.

Training sessions leading up to the match have been intense. Competition for places has raised standards across the squad, and players are eager to impress both the technical bench and the supporters.

The fans are expected to play their part. Drums, chants, and club colors will fill the stands, turning the venue into a fortress of noise and passion. For many supporters, this match is a celebration of football's return.

Beyond the result, the encounter reflects Isiolo City FC's ambition to grow, compete, and build a winning culture ahead of the league season.

As kickoff approaches, one thing is certain:
**The stands will be full, the energy will be electric, and the Bulls will be ready to charge.**

🐂⚽ *Football returns. Isiolo rises.*`,
      excerpt: 'Excitement builds as Isiolo City FC host Town FC of Marsabit in a preseason friendly expected to draw record crowds and test the Bulls ahead of the new season.',
      category: 'PRESEASON',
      status: 'PUBLISHED',
      featuredImageUrl: 'https://res.cloudinary.com/dzideskz7/image/upload/v1767091875/Gemini_Generated_Image_sjqr81sjqr81sjqr_qr7f6z.png',
      tags: ['match preview', 'preseason', 'friendly', 'Town FC', 'Marsabit'],
      authorId: admin.id,
      publishedAt: new Date('2025-12-28T08:00:00Z'),
    },
  });

  console.log('✅ Article 2 created: Town FC Friendly');

  // Create Article 3: Tree Planting Initiative
  const article3 = await prisma.article.upsert({
    where: { slug: 'isiolo-city-fc-players-distribute-seedlings-december-rains' },
    update: {},
    create: {
      id: generateIcfcIdWithModel('article'),
      title: 'Isiolo City FC Players Give Back as They Distribute Seedlings During December Short Rains',
      slug: 'isiolo-city-fc-players-distribute-seedlings-december-rains',
      content: `
As the December short rains swept across Isiolo, **Isiolo City Football Club — the Bulls — stepped beyond football**, joining the community in an environmental conservation initiative through the distribution of tree seedlings.

With the rains providing ideal planting conditions, Bulls players worked alongside local residents to encourage **tree planting, environmental awareness, and sustainable living**. The initiative aimed to support long-term ecological balance while strengthening the bond between the club and the community it proudly represents.

For Isiolo City FC, this was more than a symbolic gesture. It reflected the club's belief that football institutions have a responsibility to contribute positively to society. Players engaged with residents, schools, and youth groups, sharing knowledge on the importance of trees in combating climate change, preventing soil erosion, and improving air quality.

> "This is our home," one player noted. "Protecting the environment means protecting our future."

The exercise was warmly received, with community members praising the club for leading by example. Young fans, in particular, were inspired to see their football heroes involved in community development.

Club officials emphasized that environmental responsibility aligns with the Bulls' core values of **discipline, responsibility, and unity**. Just as the team plans for success on the pitch, the club believes in nurturing long-term growth off it.

As the seedlings take root during the rainy season, they symbolize hope, renewal, and shared responsibility. Isiolo City FC remains committed to initiatives that uplift the community and protect the environment.

🌱🐂 *Together with the community, the Bulls continue to grow.*`,
      excerpt: 'Isiolo City FC players join the community in distributing tree seedlings during the December rains, demonstrating the club\'s commitment to environmental conservation and social responsibility.',
      category: 'COMMUNITY_OUTREACH',
      status: 'PUBLISHED',
      featuredImageUrl: 'https://res.cloudinary.com/dzideskz7/image/upload/v1767091880/Gemini_Generated_Image_alrzztalrzztalrz_qd2d9a.png',
      tags: ['community', 'environment', 'tree planting', 'social responsibility', 'CSR'],
      authorId: admin.id,
      publishedAt: new Date('2025-12-18T11:00:00Z'),
    },
  });

  console.log('✅ Article 3 created: Tree Planting Initiative');

  // Create Article 4: Captain Fantastic
  const article4 = await prisma.article.upsert({
    where: { slug: 'meet-captain-fantastic-arafat-mohamed' },
    update: {},
    create: {
      id: generateIcfcIdWithModel('article'),
      title: 'Meet Our Captain Fantastic: Arafat Mohamed',
      slug: 'meet-captain-fantastic-arafat-mohamed',
      content: `Leadership, commitment, and passion define **Arafat Mohamed**, fondly known as **Arif** — the heartbeat of **Isiolo City FC** and the man entrusted with wearing the captain’s armband. As the Bulls continue to build a competitive and disciplined squad, Arif stands out as a symbol of resilience and responsibility both on and off the pitch.

Arafat Mohamed leads by example. Calm under pressure and fearless in competition, he brings balance and authority to the team. Whether organizing play, motivating teammates, or making crucial interventions, Arif’s presence is felt across the pitch. His understanding of the game and ability to read situations have made him a natural leader within the dressing room.

## A Captain Built on Hard Work

Arif’s journey to captaincy is a story of dedication and consistency. Rising through local football structures, he earned his place through discipline, strong performances, and unwavering commitment to the club’s values. Coaches and teammates alike recognize him as a player who trains hard, listens, and constantly seeks improvement — qualities that define a true captain.

His leadership style is rooted in communication and accountability. Arif ensures standards are upheld during training and matchdays, demanding the best from himself before asking it of others. This approach has helped foster unity and belief within the Isiolo City FC squad.

## On-Field Influence

Operating as a commanding figure on the pitch, Arif combines tactical awareness with physical strength and composure. He plays with intelligence, understands when to press or drop, and knows how to manage game tempo — especially in high-pressure situations. His reliability has made him one of the first names on the team sheet.

Beyond his technical ability, Arif embodies the Bulls’ fighting spirit. He never shies away from responsibility, particularly in tough matches where leadership is most required.

## A Role Model for the Community

Off the pitch, Arif represents the club with humility and pride. He connects easily with supporters, inspires younger players, and understands the responsibility that comes with captaining a community-driven club like Isiolo City FC.

## Captain Fantastic

As Isiolo City FC looks toward a challenging and ambitious season ahead, having **Arafat Mohamed  (Arif)** as captain provides stability, confidence, and direction. He is more than just a leader — he is the standard.

**Captain Fantastic. Leader of the Bulls.** 🐂⚽**`,
      excerpt: 'Meet Arafat Mohamed, the calm and composed leader who embodies discipline, professionalism, and unity as captain of Isiolo City Football Club.',
      category: 'PLAYER_PROFILE',
      status: 'PUBLISHED',
      featuredImageUrl: 'https://res.cloudinary.com/dzideskz7/image/upload/v1767115888/IMG-20251230-WA0021_bbyrap.jpg',
      tags: ['player profile', 'captain', 'Arafat ', 'leadership', 'team'],
      authorId: admin.id,
      publishedAt: new Date('2025-12-26T10:00:00Z'),
    },
  });

  console.log('✅ Article 4 created: Captain Fantastic');
  console.log('');

  console.log('');
  console.log('========================================');
  console.log('Seed completed successfully! 🎉');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
