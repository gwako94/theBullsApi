import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  # ============================================
  # AUTHENTICATION & USERS
  # ============================================

  enum UserRole {
    ADMIN
    MEMBER
    FAN
    COACH
    PLAYER
  }

  enum MembershipTier {
    FREE
    BRONZE
    SILVER
    GOLD
    PLATINUM
  }

  type User {
    id: ID!
    email: String!
    name: String!
    role: UserRole!
    membershipTier: MembershipTier!
    avatar: String
    phone: String
    dateOfBirth: DateTime
    nationality: String
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AuthPayload {
    token: String!
    refreshToken: String!
    user: User!
  }

  input RegisterInput {
    email: String!
    password: String!
    name: String!
    phone: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  # ============================================
  # CONTENT MANAGEMENT
  # ============================================

  enum ContentCategory {
    NEWS
    MATCH_REPORT
    INTERVIEW
    FEATURE
    PRESS_RELEASE
    ANNOUNCEMENT
    PRESEASON
    COACH
    CLUB_UPDATE
    COMMUNITY_OUTREACH
    PLAYER_PROFILE
  }

  enum ContentStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }

  type Article {
    id: ID!
    title: String!
    slug: String!
    excerpt: String!
    content: String!
    category: ContentCategory!
    status: ContentStatus!
    author: User!
    featuredImageUrl: String
    publishedAt: DateTime
    viewCount: Int!
    tags: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateArticleInput {
    title: String!
    excerpt: String!
    content: String!
    category: ContentCategory!
    featuredImageUrl: String
    tags: [String!]
  }

  input UpdateArticleInput {
    title: String
    excerpt: String
    content: String
    category: ContentCategory
    featuredImageUrl: String
    tags: [String!]
    status: ContentStatus
  }

  # ============================================
  # PLAYERS & TEAM
  # ============================================

  enum Position {
    GOALKEEPER
    DEFENDER
    MIDFIELDER
    FORWARD
  }

  enum PlayerStatus {
    ACTIVE
    INJURED
    SUSPENDED
    ON_LOAN
    RETIRED
  }

  type Player {
    id: ID!
    firstName: String!
    lastName: String!
    displayName: String!
    position: Position!
    jerseyNumber: Int!
    nationality: String!
    dateOfBirth: DateTime!
    height: Float
    weight: Float
    preferredFoot: String
    status: PlayerStatus!
    bio: String
    joinedDate: DateTime!
    contractEndDate: DateTime
    photoUrls: [String!]!
    stats: PlayerStats
    achievements: [Achievement!]!
    createdAt: DateTime!
  }

  type PlayerStats {
    id: ID!
    season: String!
    appearances: Int!
    goals: Int!
    assists: Int!
    yellowCards: Int!
    redCards: Int!
    minutesPlayed: Int!
    passAccuracy: Float
    shotsOnTarget: Int!
    tackles: Int!
    interceptions: Int!
    saves: Int!
    cleanSheets: Int!
  }

  type Achievement {
    id: ID!
    title: String!
    description: String
    awardedAt: DateTime!
    season: String
  }

  input CreatePlayerInput {
    firstName: String!
    lastName: String!
    displayName: String!
    position: Position!
    jerseyNumber: Int!
    nationality: String!
    dateOfBirth: DateTime!
    height: Float
    weight: Float
    preferredFoot: String
    bio: String
    joinedDate: DateTime!
    photoUrls: [String!]
  }

  type BulkPlayerResult {
    success: Boolean!
    created: Int!
    failed: Int!
    errors: [String!]!
    players: [Player!]!
  }

  # ============================================
  # MATCHES & FIXTURES
  # ============================================

  enum MatchStatus {
    SCHEDULED
    LIVE
    HALFTIME
    FULLTIME
    POSTPONED
    CANCELLED
  }

  type Match {
    id: ID!
    homeTeam: Team!
    awayTeam: Team!
    venue: Venue!
    kickoffTime: DateTime!
    competition: String!
    season: String!
    status: MatchStatus!
    homeScore: Int
    awayScore: Int
    attendance: Int
    matchReport: String
    highlightUrls: [String!]!
    createdAt: DateTime!
  }

  type Team {
    id: ID!
    name: String!
    shortName: String!
    logo: String
    country: String!
    founded: Int
    stadium: String
    website: String
  }

  type Venue {
    id: ID!
    name: String!
    city: String!
    country: String!
    capacity: Int!
    address: String
  }

  input CreateMatchInput {
    homeTeamId: ID!
    awayTeamId: ID!
    venueId: ID!
    kickoffTime: DateTime!
    competition: String!
    season: String!
  }

  # ============================================
  # FOUNDATION & EDUCATION
  # ============================================

  enum ProgramType {
    YOUTH_ACADEMY
    TRAINING_CAMP
    CLINIC
    SCHOLARSHIP
    COMMUNITY_OUTREACH
    COACHING_COURSE
  }

  type FoundationProgram {
    id: ID!
    name: String!
    description: String!
    type: ProgramType!
    startDate: DateTime!
    endDate: DateTime
    location: String!
    capacity: Int!
    ageGroup: String
    price: Float
    isActive: Boolean!
    enrollments: [Enrollment!]!
    createdAt: DateTime!
  }

  type Enrollment {
    id: ID!
    program: FoundationProgram!
    studentName: String!
    studentAge: Int!
    guardianName: String!
    guardianEmail: String!
    guardianPhone: String!
    status: String!
    enrolledAt: DateTime!
  }

  input CreateProgramInput {
    name: String!
    description: String!
    type: ProgramType!
    startDate: DateTime!
    endDate: DateTime
    location: String!
    capacity: Int!
    ageGroup: String
    price: Float
  }

  input EnrollProgramInput {
    programId: ID!
    studentName: String!
    studentAge: Int!
    guardianName: String!
    guardianEmail: String!
    guardianPhone: String!
  }

  # ============================================
  # SHOP & E-COMMERCE
  # ============================================

  enum ProductCategory {
    JERSEYS
    TRAINING_GEAR
    ACCESSORIES
    COLLECTIBLES
    KIDS
  }

  type Product {
    id: ID!
    name: String!
    slug: String!
    description: String!
    price: Float!
    comparePrice: Float
    category: ProductCategory!
    stock: Int!
    sku: String!
    featured: Boolean!
    isActive: Boolean!
    sizes: [String!]!
    colors: [String!]!
    imageUrls: [String!]!
    createdAt: DateTime!
  }

  enum OrderStatus {
    PENDING
    PROCESSING
    SHIPPED
    DELIVERED
    CANCELLED
    REFUNDED
  }

  type Order {
    id: ID!
    user: User!
    orderNumber: String!
    status: OrderStatus!
    totalAmount: Float!
    shippingAddress: String!
    paymentMethod: String!
    paymentStatus: String!
    items: [OrderItem!]!
    createdAt: DateTime!
  }

  type OrderItem {
    id: ID!
    product: Product!
    quantity: Int!
    price: Float!
    size: String
    color: String
  }

  input CreateOrderInput {
    items: [OrderItemInput!]!
    shippingAddress: String!
    paymentMethod: String!
  }

  input OrderItemInput {
    productId: ID!
    quantity: Int!
    size: String
    color: String
  }

  # ============================================
  # SPONSORS & PARTNERSHIPS
  # ============================================

  enum SponsorTier {
    TITLE
    PLATINUM
    GOLD
    SILVER
    BRONZE
    PARTNER
  }

  type Sponsor {
    id: ID!
    name: String!
    logo: String!
    website: String
    tier: SponsorTier!
    description: String
    startDate: DateTime!
    endDate: DateTime
    isActive: Boolean!
    displayOrder: Int!
  }

  input CreateSponsorInput {
    name: String!
    logo: String!
    website: String
    tier: SponsorTier!
    description: String
    startDate: DateTime!
    endDate: DateTime
  }

  # ============================================
  # QUERIES
  # ============================================

  type Query {
    # Auth
    me: User

    # Content
    articles(category: ContentCategory, limit: Int, offset: Int): [Article!]!
    article(slug: String!): Article
    latestNews(limit: Int): [Article!]!

    # Players
    players(position: Position, status: PlayerStatus): [Player!]!
    player(id: ID!): Player
    playersByPosition(position: Position!): [Player!]!

    # Matches
    matches(status: MatchStatus, limit: Int): [Match!]!
    match(id: ID!): Match
    upcomingMatches(limit: Int): [Match!]!

    # Foundation
    foundationPrograms(type: ProgramType, isActive: Boolean): [FoundationProgram!]!
    foundationProgram(id: ID!): FoundationProgram

    # Shop
    products(category: ProductCategory, featured: Boolean, limit: Int): [Product!]!
    product(slug: String!): Product

    # Sponsors
    sponsors(tier: SponsorTier, isActive: Boolean): [Sponsor!]!
    sponsor(id: ID!): Sponsor
  }

  # ============================================
  # MUTATIONS
  # ============================================

  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    refreshToken(refreshToken: String!): AuthPayload!

    # Content (Admin only)
    createArticle(input: CreateArticleInput!): Article!
    updateArticle(id: ID!, input: UpdateArticleInput!): Article!
    publishArticle(id: ID!): Article!
    deleteArticle(id: ID!): Boolean!

    # Players (Admin only)
    createPlayer(input: CreatePlayerInput!): Player!
    bulkCreatePlayers(input: [CreatePlayerInput!]!): BulkPlayerResult!
    updatePlayer(id: ID!, input: JSON!): Player!
    deletePlayer(id: ID!): Boolean!

    # Matches (Admin only)
    createMatch(input: CreateMatchInput!): Match!
    updateMatchStatus(id: ID!, status: MatchStatus!): Match!
    updateMatchScore(id: ID!, homeScore: Int!, awayScore: Int!): Match!

    # Foundation
    createProgram(input: CreateProgramInput!): FoundationProgram!
    enrollInProgram(input: EnrollProgramInput!): Enrollment!

    # Shop
    createOrder(input: CreateOrderInput!): Order!

    # Sponsors (Admin only)
    createSponsor(input: CreateSponsorInput!): Sponsor!
    updateSponsor(id: ID!, input: JSON!): Sponsor!

    # Newsletter
    subscribeNewsletter(email: String!): Boolean!
  }

  # ============================================
  # SUBSCRIPTIONS
  # ============================================

  type Subscription {
    matchUpdate(matchId: ID!): Match!
    newArticle: Article!
  }
`;
