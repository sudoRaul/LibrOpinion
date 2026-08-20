// ════════════════════════════════════════════════════════════════════════════
// Textos legales (bilingües ES/EN). NO es asesoramiento jurídico: son plantillas
// a medida de la app como punto de partida.
//
// Datos que se cambian en UN solo sitio al desplegar / comprar dominio:
//   - LEGAL_CONTACT_EMAIL: correo real donde ejercer derechos (RGPD).
//   - LEGAL_UPDATED: fecha de última actualización.
// (Ver la memoria `deploy-domain-checklist`.)
// ════════════════════════════════════════════════════════════════════════════

/** Buzón real de contacto legal/privacidad (cambiar por uno del dominio propio cuando exista). */
export const LEGAL_CONTACT_EMAIL = 'rrodfer05@gmail.com'
export const LEGAL_UPDATED = '2026-08-18'

export interface LegalSection {
  heading?: string
  paragraphs?: string[]
  bullets?: string[]
}
export interface LegalDoc {
  title: string
  intro?: string
  sections: LegalSection[]
}
export type LegalKey = 'privacy' | 'terms' | 'notice'
export type LegalLang = 'es' | 'en'

const E = LEGAL_CONTACT_EMAIL

export const LEGAL: Record<LegalLang, Record<LegalKey, LegalDoc>> = {
  es: {
    privacy: {
      title: 'Política de Privacidad',
      intro:
        'En librOpinion nos tomamos en serio tu privacidad. Esta política explica qué datos personales tratamos, con qué fin y qué derechos tienes. librOpinion es un proyecto personal y sin ánimo de lucro.',
      sections: [
        {
          heading: '1. Responsable del tratamiento',
          paragraphs: [
            'Raúl, desarrollador de librOpinion (proyecto personal no comercial, España).',
            `Contacto para asuntos de privacidad: ${E}.`,
          ],
        },
        {
          heading: '2. Qué datos tratamos',
          paragraphs: ['Según cómo uses la aplicación, podemos tratar:'],
          bullets: [
            'Datos de cuenta: tu correo electrónico y una contraseña (que se almacena cifrada), o, si entras con Google, los datos que Google nos comparte (nombre, correo y foto de perfil).',
            'Datos de perfil: nombre visible, nombre de usuario, biografía, avatar e idioma preferido.',
            'Contenido que publicas: citas de libros, páginas, notas, libros que añades al catálogo, «me gusta», comentarios y a quién sigues.',
            'Datos de moderación: reportes que envíes y, en su caso, el estado y motivo de una posible suspensión.',
            'Datos técnicos: dirección IP y datos de conexión registrados por nuestros proveedores de hosting, y el almacenamiento local del navegador (sesión, tema e idioma).',
          ],
        },
        {
          heading: '3. Con qué finalidad y base jurídica',
          bullets: [
            'Prestar el servicio (crear tu cuenta, mostrar el feed, publicar y ver citas): ejecución de la relación de servicio que aceptas al registrarte.',
            'Autenticación y seguridad de las cuentas: interés legítimo y ejecución del servicio.',
            'Moderación y cumplimiento de las normas de la comunidad (reportes, suspensiones): interés legítimo en mantener un espacio sano.',
            'Envío de correos transaccionales (por ejemplo, avisos de moderación): interés legítimo y, en su caso, obligación de informarte.',
          ],
          paragraphs: ['No hacemos marketing ni elaboramos perfiles con fines publicitarios.'],
        },
        {
          heading: '4. Destinatarios y encargados del tratamiento',
          paragraphs: [
            'No vendemos tus datos. Para funcionar, la aplicación se apoya en proveedores que actúan como encargados del tratamiento:',
          ],
          bullets: [
            'Supabase: base de datos, autenticación y almacenamiento de archivos.',
            'Google: inicio de sesión con Google (solo si eliges esa opción).',
            'Resend: envío de correos transacionales de moderación.',
            'Netlify: alojamiento y distribución (CDN) de la aplicación.',
          ],
        },
        {
          heading: '5. Transferencias internacionales',
          paragraphs: [
            'Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo (por ejemplo, en EE. UU.). En esos casos, la transferencia se ampara en las garantías previstas por el RGPD (decisiones de adecuación o cláusulas contractuales tipo).',
          ],
        },
        {
          heading: '6. Conservación',
          paragraphs: [
            'Conservamos tus datos mientras tu cuenta esté activa. Si solicitas la baja, eliminamos tu cuenta y su contenido asociado, salvo lo que debamos conservar por obligación legal o para gestionar incidencias de seguridad/moderación durante un tiempo limitado.',
          ],
        },
        {
          heading: '7. Tus derechos',
          paragraphs: [
            'Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad.',
            `Para ejercerlos, escríbenos a ${E}. También puedes solicitar la eliminación de tu cuenta por esa vía.`,
            'Si consideras que no hemos atendido correctamente tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos (AEPD, www.aepd.es).',
          ],
        },
        {
          heading: '8. Cookies y almacenamiento local',
          paragraphs: [
            'No usamos cookies de terceros, publicidad ni herramientas de analítica. Solo empleamos almacenamiento local del navegador estrictamente necesario para el funcionamiento: mantener tu sesión iniciada y recordar tus preferencias de tema (claro/oscuro) e idioma. Por ser técnicamente necesario, no requiere consentimiento previo.',
          ],
        },
        {
          heading: '9. Menores de edad',
          paragraphs: [
            'Para usar librOpinion debes tener al menos 14 años. Si detectamos una cuenta de una persona menor de esa edad, la eliminaremos.',
          ],
        },
        {
          heading: '10. Seguridad',
          paragraphs: [
            'Aplicamos medidas técnicas razonables (control de acceso por filas en la base de datos, cifrado en tránsito, contraseñas almacenadas de forma cifrada). Ningún sistema es infalible, pero trabajamos para proteger tu información.',
          ],
        },
        {
          heading: '11. Cambios en esta política',
          paragraphs: [
            'Podemos actualizar esta política para reflejar cambios en la aplicación o en la normativa. Publicaremos siempre la versión vigente en esta página, indicando la fecha de última actualización.',
          ],
        },
      ],
    },
    terms: {
      title: 'Términos de Uso',
      intro:
        'Estos términos regulan el uso de librOpinion. Al crear una cuenta o usar la aplicación, los aceptas.',
      sections: [
        {
          heading: '1. Objeto',
          paragraphs: [
            'librOpinion es una red social, sin ánimo de lucro, donde las personas usuarias publican citas de libros (con su página y una nota u opinión), siguen a otras personas y descubren lo que leen.',
          ],
        },
        {
          heading: '2. Requisitos de acceso',
          paragraphs: [
            'Debes tener al menos 14 años y proporcionar información veraz al registrarte. Eres responsable de mantener la confidencialidad de tu contraseña.',
          ],
        },
        {
          heading: '3. Tu cuenta',
          paragraphs: [
            'Eres responsable de la actividad de tu cuenta. Puedes tener una cuenta pública o privada; en las privadas, las solicitudes de seguimiento las apruebas tú.',
          ],
        },
        {
          heading: '4. Contenido de las personas usuarias',
          paragraphs: [
            'Eres el único responsable del contenido que publicas (citas, notas, libros, comentarios, avatar, etc.). Al publicarlo, concedes a librOpinion una licencia limitada y no exclusiva para almacenarlo y mostrarlo dentro de la aplicación con el fin de prestar el servicio.',
            'Al publicar citas de libros, hazlo como fragmentos breves y cita a su autor y obra. No subas contenido sobre el que no tengas derechos ni que infrinja derechos de terceros.',
          ],
        },
        {
          heading: '5. Normas de conducta',
          paragraphs: ['No está permitido, entre otros:'],
          bullets: [
            'Acosar, amenazar o incitar al odio contra otras personas.',
            'Publicar spam, contenido sexual explícito, violento o ilícito.',
            'Suplantar la identidad de otras personas o marcas.',
            'Intentar vulnerar la seguridad de la aplicación o de otras cuentas.',
          ],
        },
        {
          heading: '6. Moderación y suspensión',
          paragraphs: [
            'Para mantener una comunidad sana, podemos retirar contenido y suspender o eliminar cuentas que incumplan estos términos. Cuando suspendemos una cuenta, te informamos del motivo por correo. Puedes responder a ese correo si crees que ha habido un error.',
          ],
        },
        {
          heading: '7. Propiedad intelectual',
          paragraphs: [
            'La marca, el diseño y el código de librOpinion pertenecen a su titular. Los libros y sus textos pertenecen a sus respectivos autores y editoriales; librOpinion solo permite compartir citas breves con fines de comentario y difusión cultural.',
          ],
        },
        {
          heading: '8. Disponibilidad y naturaleza del servicio',
          paragraphs: [
            'librOpinion es un proyecto personal y sin ánimo de lucro. Se ofrece «tal cual» y «según disponibilidad», sin garantías de funcionamiento ininterrumpido. Podemos modificar, suspender o discontinuar el servicio.',
          ],
        },
        {
          heading: '9. Limitación de responsabilidad',
          paragraphs: [
            'En la medida permitida por la ley, no nos hacemos responsables de los daños derivados del uso o la imposibilidad de uso del servicio, ni del contenido publicado por las personas usuarias.',
          ],
        },
        {
          heading: '10. Baja y eliminación de cuenta',
          paragraphs: [
            `Puedes solicitar la eliminación de tu cuenta y de tus datos escribiendo a ${E}. Atenderemos tu solicitud conforme a la Política de Privacidad.`,
          ],
        },
        {
          heading: '11. Modificaciones',
          paragraphs: [
            'Podemos actualizar estos términos. Publicaremos la versión vigente en esta página con su fecha. El uso continuado tras un cambio implica su aceptación.',
          ],
        },
        {
          heading: '12. Ley aplicable',
          paragraphs: [
            'Estos términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales que correspondan conforme a la normativa aplicable.',
          ],
        },
      ],
    },
    notice: {
      title: 'Aviso Legal',
      sections: [
        {
          heading: '1. Identificación',
          paragraphs: [
            'Responsable del sitio: Raúl, desarrollador de librOpinion (particular, España).',
            `Correo de contacto: ${E}.`,
          ],
        },
        {
          heading: '2. Naturaleza del proyecto',
          paragraphs: [
            'librOpinion es un proyecto personal y sin ánimo de lucro. No se comercializan productos ni servicios a través de este sitio.',
          ],
        },
        {
          heading: '3. Condiciones de uso',
          paragraphs: [
            'El acceso y uso de la aplicación implican la aceptación de los Términos de Uso y de la Política de Privacidad publicados en este mismo sitio.',
          ],
        },
        {
          heading: '4. Propiedad intelectual e industrial',
          paragraphs: [
            'El diseño, la marca y el código de librOpinion pertenecen a su titular. El contenido publicado por las personas usuarias y los textos de los libros pertenecen a sus respectivos autores.',
          ],
        },
        {
          heading: '5. Responsabilidad',
          paragraphs: [
            'El titular no se responsabiliza del contenido publicado por las personas usuarias ni de un uso indebido de la aplicación, y no garantiza la disponibilidad ininterrumpida del servicio.',
          ],
        },
        {
          heading: '6. Legislación aplicable',
          paragraphs: ['Este aviso legal se rige por la legislación española.'],
        },
      ],
    },
  },

  en: {
    privacy: {
      title: 'Privacy Policy',
      intro:
        'At librOpinion we take your privacy seriously. This policy explains what personal data we process, why, and what rights you have. librOpinion is a personal, non-commercial project.',
      sections: [
        {
          heading: '1. Data controller',
          paragraphs: [
            'Raúl, developer of librOpinion (personal non-commercial project, Spain).',
            `Privacy contact: ${E}.`,
          ],
        },
        {
          heading: '2. What data we process',
          paragraphs: ['Depending on how you use the app, we may process:'],
          bullets: [
            'Account data: your email and a password (stored encrypted), or, if you sign in with Google, the data Google shares with us (name, email and profile picture).',
            'Profile data: display name, username, bio, avatar and preferred language.',
            'Content you post: book quotes, pages, notes, books you add to the catalog, likes, comments and who you follow.',
            'Moderation data: reports you submit and, where applicable, the status and reason of a possible suspension.',
            'Technical data: IP address and connection data logged by our hosting providers, and browser local storage (session, theme and language).',
          ],
        },
        {
          heading: '3. Purposes and legal basis',
          bullets: [
            'Providing the service (creating your account, showing the feed, posting and viewing quotes): performance of the service relationship you accept when registering.',
            'Account authentication and security: legitimate interest and performance of the service.',
            'Moderation and enforcement of community rules (reports, suspensions): legitimate interest in keeping a healthy space.',
            'Sending transactional emails (e.g. moderation notices): legitimate interest and, where applicable, our duty to inform you.',
          ],
          paragraphs: ['We do no marketing and build no advertising profiles.'],
        },
        {
          heading: '4. Recipients and processors',
          paragraphs: [
            'We do not sell your data. To operate, the app relies on providers acting as data processors:',
          ],
          bullets: [
            'Supabase: database, authentication and file storage.',
            'Google: Google sign-in (only if you choose it).',
            'Resend: sending transactional moderation emails.',
            'Netlify: hosting and content delivery (CDN).',
          ],
        },
        {
          heading: '5. International transfers',
          paragraphs: [
            'Some of these providers may process data outside the European Economic Area (e.g. in the USA). In such cases, the transfer relies on the safeguards provided by the GDPR (adequacy decisions or standard contractual clauses).',
          ],
        },
        {
          heading: '6. Retention',
          paragraphs: [
            'We keep your data while your account is active. If you request deletion, we remove your account and its associated content, except what we must keep due to a legal obligation or to handle security/moderation incidents for a limited time.',
          ],
        },
        {
          heading: '7. Your rights',
          paragraphs: [
            'You may exercise your rights of access, rectification, erasure, objection, restriction of processing and portability.',
            `To do so, write to us at ${E}. You may also request the deletion of your account this way.`,
            'If you believe we have not handled your request properly, you may lodge a complaint with the Spanish Data Protection Agency (AEPD, www.aepd.es).',
          ],
        },
        {
          heading: '8. Cookies and local storage',
          paragraphs: [
            'We use no third-party cookies, advertising or analytics tools. We only use strictly necessary browser local storage: keeping you signed in and remembering your theme (light/dark) and language preferences. As it is technically necessary, it does not require prior consent.',
          ],
        },
        {
          heading: '9. Minors',
          paragraphs: [
            'You must be at least 14 years old to use librOpinion. If we detect an account belonging to someone younger, we will delete it.',
          ],
        },
        {
          heading: '10. Security',
          paragraphs: [
            'We apply reasonable technical measures (row-level access control in the database, encryption in transit, passwords stored encrypted). No system is infallible, but we work to protect your information.',
          ],
        },
        {
          heading: '11. Changes to this policy',
          paragraphs: [
            'We may update this policy to reflect changes in the app or in the law. We will always publish the current version on this page, indicating the last update date.',
          ],
        },
      ],
    },
    terms: {
      title: 'Terms of Use',
      intro:
        'These terms govern the use of librOpinion. By creating an account or using the app, you accept them.',
      sections: [
        {
          heading: '1. Purpose',
          paragraphs: [
            'librOpinion is a non-commercial social network where users post book quotes (with the page and a note or opinion), follow other people and discover what they read.',
          ],
        },
        {
          heading: '2. Access requirements',
          paragraphs: [
            'You must be at least 14 years old and provide truthful information when registering. You are responsible for keeping your password confidential.',
          ],
        },
        {
          heading: '3. Your account',
          paragraphs: [
            'You are responsible for your account activity. You may have a public or private account; on private accounts, you approve follow requests yourself.',
          ],
        },
        {
          heading: '4. User content',
          paragraphs: [
            'You are solely responsible for the content you post (quotes, notes, books, comments, avatar, etc.). By posting it, you grant librOpinion a limited, non-exclusive license to store and display it within the app in order to provide the service.',
            'When posting book quotes, keep them as short excerpts and credit the author and work. Do not upload content you have no rights to or that infringes third-party rights.',
          ],
        },
        {
          heading: '5. Rules of conduct',
          paragraphs: ['The following are not allowed, among others:'],
          bullets: [
            'Harassing, threatening or inciting hatred against others.',
            'Posting spam, explicit sexual, violent or unlawful content.',
            'Impersonating other people or brands.',
            'Attempting to breach the security of the app or of other accounts.',
          ],
        },
        {
          heading: '6. Moderation and suspension',
          paragraphs: [
            'To keep a healthy community, we may remove content and suspend or delete accounts that break these terms. When we suspend an account, we inform you of the reason by email. You may reply to that email if you believe there has been a mistake.',
          ],
        },
        {
          heading: '7. Intellectual property',
          paragraphs: [
            'The brand, design and code of librOpinion belong to its owner. Books and their texts belong to their respective authors and publishers; librOpinion only allows sharing short quotes for the purpose of commentary and cultural dissemination.',
          ],
        },
        {
          heading: '8. Availability and nature of the service',
          paragraphs: [
            'librOpinion is a personal, non-commercial project. It is offered "as is" and "as available", with no guarantee of uninterrupted operation. We may modify, suspend or discontinue the service.',
          ],
        },
        {
          heading: '9. Limitation of liability',
          paragraphs: [
            'To the extent permitted by law, we are not liable for damages arising from the use of or inability to use the service, nor for content posted by users.',
          ],
        },
        {
          heading: '10. Account deletion',
          paragraphs: [
            `You may request the deletion of your account and data by writing to ${E}. We will handle your request in accordance with the Privacy Policy.`,
          ],
        },
        {
          heading: '11. Changes',
          paragraphs: [
            'We may update these terms. We will publish the current version on this page with its date. Continued use after a change implies acceptance.',
          ],
        },
        {
          heading: '12. Governing law',
          paragraphs: [
            'These terms are governed by Spanish law. For any dispute, the parties submit to the courts that apply under the relevant regulations.',
          ],
        },
      ],
    },
    notice: {
      title: 'Legal Notice',
      sections: [
        {
          heading: '1. Identification',
          paragraphs: [
            'Site owner: Raúl, developer of librOpinion (private individual, Spain).',
            `Contact email: ${E}.`,
          ],
        },
        {
          heading: '2. Nature of the project',
          paragraphs: [
            'librOpinion is a personal, non-commercial project. No products or services are sold through this site.',
          ],
        },
        {
          heading: '3. Terms of use',
          paragraphs: [
            'Accessing and using the app implies acceptance of the Terms of Use and Privacy Policy published on this same site.',
          ],
        },
        {
          heading: '4. Intellectual and industrial property',
          paragraphs: [
            'The design, brand and code of librOpinion belong to its owner. Content posted by users and the texts of books belong to their respective authors.',
          ],
        },
        {
          heading: '5. Liability',
          paragraphs: [
            'The owner is not responsible for content posted by users or for misuse of the app, and does not guarantee uninterrupted availability of the service.',
          ],
        },
        {
          heading: '6. Governing law',
          paragraphs: ['This legal notice is governed by Spanish law.'],
        },
      ],
    },
  },
}
