import { sendSesEmail } from './ses'

export interface SendEmailParams {
  toEmails: string[]
  replyToEmails?: string[]
  subject: string
  message?: string
  html?: string
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const { ses } = useRuntimeConfig()

  let backend
  if (ses && ses.secretKey) {
    backend = sendSesEmail
  }
  else if (import.meta.dev) {
    console.warn('No email configuration found, using console.log for dev mode.')
    backend = (params: SendEmailParams) => {
      console.log(`\x1b[33mTo:\x1b[0m      ${params.toEmails}`)
      console.log(`\x1b[33mSubject:\x1b[0m ${params.subject}`)
      console.log('\n\x1b[36m================================================================\x1b[0m')
      console.log(params.message)
      console.log('\n\x1b[36m================================================================\x1b[0m')
    }
  }
  else {
    throw new Error('No email backend configured.')
  }

  await backend(params)
}
