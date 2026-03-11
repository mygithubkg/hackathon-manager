/**
 * @typedef {Object} PendingMember
 * @property {string} uid
 * @property {string} email
 * @property {string} displayName
 * @property {import('firebase/firestore').Timestamp} requestedAt
 * @property {import('firebase/firestore').Timestamp} autoApproveAt
 */

/**
 * @typedef {Object} TeamDoc
 * @property {string} name
 * @property {string} inviteCode
 * @property {string} createdBy - uid of creator
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {string[]} members - array of uids
 * @property {Array<{uid: string, email: string, displayName: string}>} memberProfiles
 * // New fields added in migration
 * @property {string} [adminId] - uid of the primary admin (default: createdBy)
 * @property {string[]} [admins] - array of admin uids
 * @property {PendingMember[]} [pendingMembers]
 * @property {string} [teamAlias] - optional public display name override
 */

/**
 * @typedef {Object} PublicProfile
 * @property {string} displayName - name others see in team
 * @property {string} bio - max 300 chars
 * @property {Array<{label: string, url: string}>} portfolioLinks - max 5
 * @property {string[]} skills - tech/skill tags, max 10
 * @property {string} [avatarURL] - optional
 */

/**
 * @typedef {Object} PrivateProfile
 * @property {string} email
 * @property {string} phone
 * @property {string} location
 * @property {import('firebase/firestore').Timestamp} updatedAt
 */

export {};
