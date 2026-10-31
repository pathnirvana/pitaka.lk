// Gets the editable App Store version of the books app ready: the appleStore texts of dev/play/store-text.mjs
// (description, what's new, promotional text, keywords) and the newest processed build (BUILD picks one), then with --submit sends it
// for review (with the screenshots of asc-screenshots.mjs):
//   node dev/apple/asc-submit.mjs [--submit]
import { api, APP, editableVersion } from './asc.mjs'
import { appleStore } from '../play/store-text.mjs'

const LOCALE = 'en-US'
if (appleStore.keywords.length > 100 || appleStore.promotionalText.length > 170) throw new Error('keywords or promotional text too long')

const version = await editableVersion()
const loc = (await api('GET', `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`)).data.find(l => l.attributes.locale === LOCALE)
if (!loc) throw new Error(`no ${LOCALE} localization`)
await api('PATCH', `/v1/appStoreVersionLocalizations/${loc.id}`, { data: { type: 'appStoreVersionLocalizations', id: loc.id, attributes: {
  description: appleStore.description, whatsNew: appleStore.whatsNew, promotionalText: appleStore.promotionalText, keywords: appleStore.keywords } } })
console.log('texts', LOCALE)

const builds = (await api('GET', `/v1/builds?filter[app]=${APP}&filter[processingState]=VALID&filter[preReleaseVersion.version]=${version.attributes.versionString}` +
  `${process.env.BUILD ? `&filter[version]=${process.env.BUILD}` : ''}&sort=-uploadedDate&limit=1`)).data
if (!builds.length) throw new Error(`no processed build of ${version.attributes.versionString}`)
await api('PATCH', `/v1/appStoreVersions/${version.id}/relationships/build`, { data: { type: 'builds', id: builds[0].id } })
console.log('build', builds[0].attributes.version)

if (process.argv.includes('--submit')) {
  // one that a failed run left open, or a new one
  const sub = (await api('GET', `/v1/reviewSubmissions?filter[app]=${APP}&filter[platform]=IOS&filter[state]=READY_FOR_REVIEW`)).data[0]
    ?? (await api('POST', '/v1/reviewSubmissions', { data: { type: 'reviewSubmissions', attributes: { platform: 'IOS' },
      relationships: { app: { data: { type: 'apps', id: APP } } } } })).data
  await api('POST', '/v1/reviewSubmissionItems', { data: { type: 'reviewSubmissionItems',
    relationships: { reviewSubmission: { data: { type: 'reviewSubmissions', id: sub.id } }, appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } } } } })
  await api('PATCH', `/v1/reviewSubmissions/${sub.id}`, { data: { type: 'reviewSubmissions', id: sub.id, attributes: { submitted: true } } })
  console.log('submitted for review', version.attributes.versionString)
}
