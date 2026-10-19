import { User, UserRole, SiteSettings } from '../types';

export const PRIMARY_OWNER_ID = 'user-owner';
export const PRIMARY_OWNER_EMAIL = 'alzymasd9@gmail.com';

export const SERVER_ROLE_LEVELS: Record<UserRole, number> = {
  visitor: 0,
  member: 1,
  vip: 2,
  moderator: 3,
  management: 4,
  admin: 5,
  system: 9,
  owner: 10,
};

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  statusCode?: number;
}

/**
 * ServerPermissionManager
 * وحدة تحكم برمجية مركزية داخل السيرفر تتعامل مع مصفوفة الصلاحيات:
 * (مشاهدة الملف، تعديل البيانات، تغيير اسم المستخدم، الصور، الإشراف والإدارة)
 * يتم التحقق من رتبة وصلاحية المستخدم في كل طلب API قبل تنفيذ أي إجراء في قاعدة البيانات.
 */
export class ServerPermissionManager {
  /**
   * هل المستخدم هو المالك الرئيسي الفعلي للموقع؟
   */
  static isPrimaryOwner(userOrId?: any): boolean {
    if (!userOrId) return false;
    if (typeof userOrId === 'string') {
      return userOrId === PRIMARY_OWNER_ID || userOrId === 'primary-owner';
    }
    return Boolean(
      userOrId.id === PRIMARY_OWNER_ID ||
      userOrId.uid === PRIMARY_OWNER_ID ||
      userOrId.isPrimaryOwner === true ||
      userOrId.is_primary_owner === true ||
      (userOrId.email && userOrId.email.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase())
    );
  }

  /**
   * الحصول على المستوى الرقمي للرتبة
   */
  static getRoleLevel(role?: UserRole | string | null): number {
    if (!role) return 0;
    return SERVER_ROLE_LEVELS[role as UserRole] ?? 0;
  }

  /**
   * هل المنفذ يملك رتبة أعلى قطعاً من المستهدف؟
   */
  static isHigherRank(actor?: User | null, target?: User | null): boolean {
    if (!actor || !target) return false;
    if (this.isPrimaryOwner(actor)) return true;
    if (this.isPrimaryOwner(target)) return false;
    return this.getRoleLevel(actor.role) > this.getRoleLevel(target.role);
  }

  /**
   * 1. فحص صلاحية مشاهدة الملف الشخصي (canViewProfile)
   */
  static canViewProfile(
    actor?: User | null,
    target?: User | null
  ): PermissionCheckResult {
    if (!target) {
      return { allowed: false, reason: 'المستخدم المستهدف غير موجود', statusCode: 404 };
    }

    // إذا كان المستهدف محظوراً ولم يكن المنفذ من طاقم الإشراف أو المالك
    if (target.isBanned && (!actor || !['owner', 'admin', 'management', 'moderator'].includes(actor.role))) {
      return { allowed: false, reason: 'هذا الحساب محظور حالياً', statusCode: 403 };
    }

    // إذا كان المنفذ في قائمة التجاهل أو الحظر الخاص بالمستهدف
    if (actor && Array.isArray(target.blockedUsers) && target.blockedUsers.includes(actor.id)) {
      if (!this.isPrimaryOwner(actor) && actor.role !== 'admin') {
        return { allowed: false, reason: 'قام هذا المستخدم بحظر الوصول إلى ملفه الشخصي', statusCode: 403 };
      }
    }

    return { allowed: true };
  }

  /**
   * فحص إمكانية مشاهدة البيانات السرية والحساسة (IP، البصمة، الموقع الدقيق)
   */
  static canViewConfidentialData(actor?: User | null): boolean {
    if (!actor) return false;
    return this.isPrimaryOwner(actor) || actor.role === 'owner' || actor.role === 'admin';
  }

  /**
   * 2. فحص صلاحية تعديل اسم المستخدم (canChangeUsername)
   * يراعي تفعيل/تعطيل الميزة من قِبل المالك الرئيسي، والرتب المستثناة
   */
  static canChangeUsername(
    actor?: User | null,
    target?: User | null,
    siteSettings?: SiteSettings
  ): PermissionCheckResult {
    if (!actor) {
      return { allowed: false, reason: 'يجب تسجيل الدخول لتغيير اسم المستخدم', statusCode: 401 };
    }

    // المالك الرئيسي يملك الصلاحية الدائمة والمطلقة
    if (this.isPrimaryOwner(actor)) {
      return { allowed: true };
    }

    // إذا كان المنفذ يعدل اسم مستخدم آخر وليس نفسه
    if (target && actor.id !== target.id) {
      if (!this.isPrimaryOwner(actor) && !['owner', 'admin', 'management'].includes(actor.role)) {
        return { allowed: false, reason: '🚫 لا تملك صلاحية تعديل اسم مستخدم آخر', statusCode: 403 };
      }
      if (this.isPrimaryOwner(target) && !this.isPrimaryOwner(actor)) {
        return { allowed: false, reason: '🚫 لا يمكن تعديل اسم صاحب الموقع الأساسي', statusCode: 403 };
      }
      if (!this.isHigherRank(actor, target)) {
        return { allowed: false, reason: '🚫 لا يمكنك تعديل اسم عضو يملك رتبة مساوية أو أعلى منك', statusCode: 403 };
      }
      return { allowed: true };
    }

    // فحص إعدادات المالك الرئيسي: هل تم تعطيل خيار تغيير الاسم للأعضاء كلياً؟
    if (siteSettings?.allowChangeUsernameForMembers === false || siteSettings?.disableUsernameChangeAll === true) {
      return {
        allowed: false,
        reason: '🚫 ميزة تغيير اسم المستخدم معطلة حالياً للأعضاء من قِبل إدارة الموقع',
        statusCode: 403
      };
    }

    // فحص الرتب المحظورة من تغيير الاسم في الإعدادات
    if (
      Array.isArray(siteSettings?.disableUsernameChangeRoles) &&
      siteSettings.disableUsernameChangeRoles.includes(actor.role)
    ) {
      return {
        allowed: false,
        reason: `🚫 ميزة تغيير اسم المستخدم غير متاحة حالياً لرتبتك (${actor.role})`,
        statusCode: 403
      };
    }

    // فحص مصفوفة صلاحيات الرتب المخصصة rolePermissions
    const roleMatrix = siteSettings?.rolePermissions;
    if (roleMatrix && Array.isArray(roleMatrix[actor.role])) {
      if (!roleMatrix[actor.role].includes('change_username')) {
        return {
          allowed: false,
          reason: '🚫 صلاحية تغيير اسم المستخدم غير مفعلة لرتبتك في إعدادات الصلاحيات',
          statusCode: 403
        };
      }
    }

    return { allowed: true };
  }

  /**
   * 2.5 فحص الكلمات والأسماء المحظورة والمحجوزة للإدارة (isForbiddenUsername)
   * تمنع اختيار أسماء معينة كـ admin أو أسماء حددها المالك في القائمة المحظورة
   */
  static isForbiddenUsername(
    username: string,
    siteSettings?: SiteSettings | null,
    isRequesterPrimaryOwner: boolean = false
  ): { forbidden: boolean; matchedWord?: string; reason?: string } {
    if (isRequesterPrimaryOwner) {
      return { forbidden: false };
    }
    if (!username || typeof username !== 'string') {
      return { forbidden: true, reason: 'اسم المستخدم غير صالح' };
    }

    const trimmed = username.trim();
    if (!trimmed) {
      return { forbidden: true, reason: 'يرجى إدخال اسم مستخدم صالح' };
    }

    // تطبيع الأحرف العربية والإنجليزية لفحص التهرب من الفلترة
    const normalize = (str: string) => {
      return str
        .toLowerCase()
        .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // إزالة التشكيل والتطويل
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\s\-_.]+/g, ''); // إزالة المسافات والفواصل
    };

    const normalizedName = normalize(trimmed);

    const configuredList = [
      ...(siteSettings?.forbiddenUsernames || []),
      ...(siteSettings?.customBadWordsList || []),
      'admin', 'administrator', 'system', 'root', 'support', 'owner',
      'الادمن', 'المالك', 'الدعم', 'مدير', 'مشرف عام', 'مؤسس', 'بوت', 'bot',
      'superadmin', 'إدارة', 'ادارة'
    ];

    const matchMode = siteSettings?.forbiddenNameMatchMode || 'contains';

    for (const word of configuredList) {
      if (!word || !word.trim()) continue;
      const cleanWord = word.trim().toLowerCase();
      const normWord = normalize(cleanWord);

      if (matchMode === 'exact') {
        if (trimmed.toLowerCase() === cleanWord || normalizedName === normWord) {
          return {
            forbidden: true,
            matchedWord: word,
            reason: `الاسم "${trimmed}" محجوز للإدارة أو محظور بقرار المالك (${word})`
          };
        }
      } else {
        // فحص الاحتواء الجزئي أو التطبيع الكامل
        if (
          trimmed.toLowerCase().includes(cleanWord) ||
          (normWord.length >= 3 && normalizedName.includes(normWord))
        ) {
          return {
            forbidden: true,
            matchedWord: word,
            reason: `الاسم "${trimmed}" يحتوي على كلمة محظورة أو محجوزة للإدارة (${word})`
          };
        }
      }
    }

    return { forbidden: false };
  }

  /**
   * 3. فحص صلاحية تعديل البيانات الشخصية (canEditProfileData)
   */
  static canEditProfileData(
    actor?: User | null,
    target?: User | null,
    updates?: Partial<User>,
    siteSettings?: SiteSettings
  ): PermissionCheckResult {
    if (!actor || !target) {
      return { allowed: false, reason: 'بيانات غير مكتملة', statusCode: 400 };
    }

    const isSelf = actor.id === target.id;

    // حماية سيادية: المالك الرئيسي لا يمكن تعديل بياناته من أي مستخدم آخر
    if (this.isPrimaryOwner(target) && !this.isPrimaryOwner(actor)) {
      return {
        allowed: false,
        reason: '🚫 حساب صاحب الموقع الأساسي محمي بشكل دائم ومطلق ولا يمكن تعديله بواسطة أي مستخدم آخر',
        statusCode: 403
      };
    }

    // إذا كان التعديل يتضمن تغيير الرتبة
    if (updates?.role && updates.role !== target.role) {
      if (!this.isPrimaryOwner(actor)) {
        return {
          allowed: false,
          reason: '🚫 رفع وتنزيل وتعديل الرتب الإدارية محصور بالمالك الرئيسي فقط (PRIMARY_OWNER)',
          statusCode: 403
        };
      }
    }

    // إذا كان التعديل يتضمن تغيير كلمة المرور
    if (updates?.password && updates.password !== target.password) {
      if (!isSelf && !this.isPrimaryOwner(actor)) {
        return {
          allowed: false,
          reason: '🚫 تغيير كلمة مرور أي عضو متاح للمالك الرئيسي فقط (PRIMARY_OWNER)',
          statusCode: 403
        };
      }
    }

    // إذا كان التعديل يتضمن تغيير اسم المستخدم
    if (updates?.username && updates.username.trim() !== target.username.trim()) {
      const nameCheck = this.canChangeUsername(actor, target, siteSettings);
      if (!nameCheck.allowed) {
        return nameCheck;
      }
      const forbiddenCheck = this.isForbiddenUsername(updates.username, siteSettings, this.isPrimaryOwner(actor));
      if (forbiddenCheck.forbidden) {
        return {
          allowed: false,
          reason: forbiddenCheck.reason || '🚫 هذا الاسم محظور أو محجوز للإدارة',
          statusCode: 400
        };
      }
    }

    // إذا كان التعديل يتضمن تعديل الصور (avatar / wallCover)
    if (
      (updates?.avatar && updates.avatar !== target.avatar) ||
      (updates?.wallCover && updates.wallCover !== target.wallCover)
    ) {
      const photoCheck = this.canEditPhotos(actor, target);
      if (!photoCheck.allowed) {
        return photoCheck;
      }
    }

    // إذا كان التعديل لمستخدم آخر غير النفس
    if (!isSelf) {
      if (!this.isPrimaryOwner(actor)) {
        const actorLevel = this.getRoleLevel(actor.role);
        const targetLevel = this.getRoleLevel(target.role);

        // يجب أن يكون المنفذ إدارة أو أعلى
        if (actorLevel < SERVER_ROLE_LEVELS.management) {
          return { allowed: false, reason: '🚫 ليس لديك الصلاحية الإدارية لتعديل بيانات الأعضاء الآخرين', statusCode: 403 };
        }

        // لا يمكن تعديل رتبة متساوية أو أعلى
        if (targetLevel >= actorLevel) {
          return { allowed: false, reason: '🚫 لا يمكنك تعديل ملف عضو يملك نفس رتبتك أو رتبة أعلى منك', statusCode: 403 };
        }
      }
    }

    return { allowed: true };
  }

  /**
   * 4. فحص صلاحية تعديل الصور والوسائط (canEditPhotos)
   */
  static canEditPhotos(
    actor?: User | null,
    target?: User | null
  ): PermissionCheckResult {
    if (!actor || !target) {
      return { allowed: false, reason: 'بيانات غير مكتملة', statusCode: 400 };
    }

    // حماية المالك الرئيسي
    if (this.isPrimaryOwner(target) && !this.isPrimaryOwner(actor)) {
      return { allowed: false, reason: '🚫 لا يمكن تعديل صور المالك الرئيسي إلا بواسطته شخصياً', statusCode: 403 };
    }

    // تعديل الصور الخاصة
    if (actor.id === target.id) {
      return { allowed: true };
    }

    // تعديل صور الآخرين: يتطلب إدارة فما فوق ورتبة أعلى
    if (this.isPrimaryOwner(actor)) return { allowed: true };

    const actorLevel = this.getRoleLevel(actor.role);
    if (actorLevel < SERVER_ROLE_LEVELS.management) {
      return { allowed: false, reason: '🚫 تعديل صور الأعضاء الآخرين مقتصر على الإدارة والمالك', statusCode: 403 };
    }

    if (!this.isHigherRank(actor, target)) {
      return { allowed: false, reason: '🚫 لا يمكنك تعديل صور عضو يملك نفس رتبتك أو رتبة أعلى منك', statusCode: 403 };
    }

    return { allowed: true };
  }

  /**
   * 5. فحص الإجراءات الإدارية (canModerate) كالكتم، الطرد، الحظر، خيارات الغرفة
   */
  static canModerate(
    actor?: User | null,
    target?: User | null,
    action: string = 'mute'
  ): PermissionCheckResult {
    if (!actor || !target) {
      return { allowed: false, reason: 'بيانات غير مكتملة', statusCode: 400 };
    }

    // إذا كان الإجراء هو حذف الحساب
    if (action === 'delete_account') {
      return this.canDeleteUser(actor, target);
    }

    // لا يمكن معاقبة المالك الرئيسي
    if (this.isPrimaryOwner(target)) {
      return { allowed: false, reason: '🚫 صاحب الموقع الأساسي محمي بحصانة سيادية مطلقة لا يمكن معاقبته', statusCode: 403 };
    }

    // حماية حساب النظام (System Bot)
    if ((target.id === 'user-system' || target.username === 'System') && !this.isPrimaryOwner(actor) && actor.role !== 'owner') {
      return { allowed: false, reason: '🚫 لا يمكن اتخاذ إجراء ضد حساب النظام إلا بواسطة المالك فقط', statusCode: 403 };
    }

    // لا يمكن معاقبة النفس
    if (actor.id === target.id) {
      return { allowed: false, reason: '🚫 لا يمكنك تطبيق إجراء إداري على نفسك', statusCode: 400 };
    }

    // المالك الرئيسي يملك كامل الصلاحيات الإشرافية المطلقة
    if (this.isPrimaryOwner(actor)) {
      return { allowed: true };
    }

    const actorLevel = this.getRoleLevel(actor.role);

    // الحظر وفك الحظر النهائي محصور بالمالك
    if (['ban', 'unban'].includes(action)) {
      if (actor.role !== 'owner') {
        return { allowed: false, reason: '🚫 صلاحية الحظر النهائي وفك الحظر محصورة بالمالك فقط', statusCode: 403 };
      }
      return { allowed: true };
    }

    // إجراءات الغرفة (room_mute, room_unmute, room_kick, room_unkick): إدارة فما فوق
    if (['room_mute', 'room_unmute', 'room_kick', 'room_unkick'].includes(action)) {
      if (actorLevel < SERVER_ROLE_LEVELS.management) {
        return { allowed: false, reason: '🚫 خيارات الغرفة متاحة فقط للإدارة والأدمن والمالك', statusCode: 403 };
      }
    } else {
      // الطرد والكتم العام: مشرف فما فوق
      if (actorLevel < SERVER_ROLE_LEVELS.moderator) {
        return { allowed: false, reason: '🚫 ليس لديك الصلاحية الإدارية لتنفيذ هذا الإجراء', statusCode: 403 };
      }
    }

    // يجب أن تكون رتبة المنفذ أعلى من المستهدف
    if (!this.isHigherRank(actor, target)) {
      return { allowed: false, reason: '🚫 لا يمكنك معاقبة عضو يملك نفس رتبتك أو رتبة أعلى منك', statusCode: 403 };
    }

    return { allowed: true };
  }

  /**
   * 6. فحص صلاحية حذف الحساب (canDeleteUser)
   * المالك الرئيسي فقط من يستطيع حذف الحسابات، أو المستخدم نفسه
   */
  static canDeleteUser(
    actor?: User | null,
    target?: User | null
  ): PermissionCheckResult {
    if (!actor || !target) {
      return { allowed: false, reason: 'بيانات غير مكتملة', statusCode: 400 };
    }

    // حساب صاحب الموقع الأساسي محمي ولا يمكن حذفه بأي شكل
    if (this.isPrimaryOwner(target)) {
      return {
        allowed: false,
        reason: '🚫 حساب صاحب الموقع الأساسي محمي بشكل دائم ومطلق، ولا يمكن حذفه أو تعطيله نهائياً.',
        statusCode: 403
      };
    }

    // حذف المستخدم لنفسه
    if (actor.id === target.id) {
      return { allowed: true };
    }

    // حذف حسابات الآخرين محصور بالمالك الرئيسي فقط
    if (!this.isPrimaryOwner(actor)) {
      return {
        allowed: false,
        reason: '🚫 غير مصرح: حذف الحسابات من الموقع محصور بالمالك الرئيسي فقط (PRIMARY_OWNER)',
        statusCode: 403
      };
    }

    return { allowed: true };
  }

  /**
   * 7. فحص صلاحية تغيير كلمة مرور عضو (canChangePassword)
   * محصورة بالمالك الرئيسي فقط (PRIMARY_OWNER)
   */
  static canChangePassword(
    actor?: User | null,
    target?: User | null
  ): PermissionCheckResult {
    if (!actor) {
      return { allowed: false, reason: 'يجب تحديد معرف صاحب الطلب', statusCode: 401 };
    }

    if (!this.isPrimaryOwner(actor)) {
      return {
        allowed: false,
        reason: '🚫 غير مصرح: المالك الرئيسي فقط (PRIMARY_OWNER) يملك صلاحية تغيير كلمات المرور للأعضاء',
        statusCode: 403
      };
    }

    if (target && this.isPrimaryOwner(target) && actor.id !== target.id) {
      return {
        allowed: false,
        reason: '🚫 لا يمكن تغيير كلمة مرور المالك الرئيسي إلا بواسطة المالك الرئيسي نفسه',
        statusCode: 403
      };
    }

    return { allowed: true };
  }

  /**
   * 8. فحص صلاحية تعديل الرتب الإدارية (canChangeRank)
   * محصورة بالمالك الرئيسي فقط (PRIMARY_OWNER)
   */
  static canChangeRank(
    actor?: User | null,
    target?: User | null
  ): PermissionCheckResult {
    if (!actor) {
      return { allowed: false, reason: 'غير مصرح', statusCode: 401 };
    }

    if (!this.isPrimaryOwner(actor)) {
      return {
        allowed: false,
        reason: '🚫 غير مصرح: رفع وتنزيل وتعديل الرتب الإدارية محصور بالمالك الرئيسي فقط (PRIMARY_OWNER)',
        statusCode: 403
      };
    }

    if (target && this.isPrimaryOwner(target)) {
      return {
        allowed: false,
        reason: '🚫 رتبة صاحب الموقع الأساسي (Primary Owner) محمية بشكل دائم ومطلق، ولا يمكن تغييرها أو خفضها لأي سبب.',
        statusCode: 403
      };
    }

    return { allowed: true };
  }
}
