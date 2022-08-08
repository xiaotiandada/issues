'use strict'

var rest = require('@octokit/rest')
var dateFns = require('date-fns')
var lodash = require('lodash')
var fs = require('fs')

function _interopNamespace(e) {
  if (e && e.__esModule) return e
  var n = Object.create(null)
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k)
        Object.defineProperty(
          n,
          k,
          d.get
            ? d
            : {
                enumerable: true,
                get: function () {
                  return e[k]
                },
              }
        )
      }
    })
  }
  n['default'] = e
  return Object.freeze(n)
}

var fs__namespace = /*#__PURE__*/ _interopNamespace(fs)

// https://docs.github.com/en/rest/reference/issues#list-repository-issues
// https://octokit.github.io/rest.js/v18
// https://github.com/DIYgod/RSSHub/blob/5ee16451dcd9abd2a1d5a9c7c8a3b905fc62e50c/lib/v2/github/issue.js
const octokit = new rest.Octokit({
  auth: process.env.GITHUB_TOKEN,
})
const owner = process.env.OWNER
const repo = process.env.REPO
process.env.REPO_PATH
const newCount = 5
/**
 * save Issues Labels
 * @param labels
 * @returns
 */
const saveIssuesLabels = (labels) => {
  if (labels.length) {
    const labelArr = labels.map((item) => item.name)
    return labelArr.length ? `\`${labelArr.join(',')}\`` : ''
  } else {
    return ''
  }
}
/**
 * format date
 * @param date
 * @returns
 */
const formatDate = (date) => {
  const time = dateFns.format(new Date(date), 'yyyy-MM-dd HH:mm:ss')
  return `<sub><time datetime="${time}">${time}</time></sub>`
}
/**
 * save Issues
 * [xxx](xxx) [ xx ]
 * @param item
 * @returns
 */
const saveIssues = (item, hasTime = false) => {
  const title = `[#${item.number} ${item.title}]`
  const link = `(${item.html_url})`
  const labels = saveIssuesLabels(item.labels)
  const date = hasTime ? ' ' + formatDate(item.updated_at) : ''
  return '- ' + title + link + ' ' + labels + date + '\n'
}
/**
 * generated Top Markdown
 * @param list
 * @returns
 */
const generatedTopMd = (list) => {
  const topResult = list.filter((item) =>
    item.labels.find((label) => label.name === 'Top')
  )
  if (topResult.length) {
    let TopMd = `\n## Top 👍 \n`
    topResult.forEach((item) => {
      TopMd += saveIssues(item)
    })
    return TopMd
  } else {
    return ''
  }
}
/**
 * generated New Markdown
 * @param list
 * @returns
 */
const generatedNewMd = (list) => {
  const cloneDeepList = lodash.cloneDeep(list)
  // sort updated_at
  // slice
  const newResult = cloneDeepList
    .sort((a, b) =>
      dateFns.compareAsc(new Date(b.updated_at), new Date(a.updated_at))
    )
    .slice(0, newCount)
  if (newResult.length) {
    let md = `\n## New  🆕 \n`
    newResult.forEach((item) => {
      md += saveIssues(item, true)
    })
    return md
  } else {
    return ''
  }
}
/**
 * generated Article list Markdown
 * @param list
 * @returns
 */
const generatedArticleListMd = (list) => {
  if (list.length) {
    let md = `\n## Article  📄 \n`
    list.forEach((item) => {
      md += saveIssues(item)
    })
    return md
  } else {
    return ''
  }
}
/**
 * process markdown
 * @param data issues list
 */
const processMd = ({ data }) => {
  // Head
  let headMd = `## Blog\nMy personal blog using issues and GitHub Actions\n`
  // Top
  let TopMd = generatedTopMd(data)
  // New
  let newMd = generatedNewMd(data)
  // List
  let listMd = generatedArticleListMd(data)
  const result = headMd + TopMd + newMd + listMd
  {
    try {
      const data = fs__namespace.writeFileSync('DEMO.md', result)
      //文件写入成功。
    } catch (err) {
      console.error(err)
    }
  }
}
/**
 * get repo
 */
const getRepo = async () => {
  try {
    const { status, data } = await octokit.rest.repos.get({
      owner,
      repo,
    })
    if (status === 200) {
      // console.log('data', data)
      return data
    } else {
      console.log('fail', status)
      return false
    }
  } catch (e) {
    console.log('getRepo', e.toString())
    return false
  }
}
/**
 * init issues
 */
const init = async () => {
  try {
    const respo = await getRepo()
    let count = respo.open_issues_count
    let per_page = 100 // default 30 max 100
    let len = Math.floor(count / per_page) + 1
    let list = []
    for (let i = 1; i <= len; i++) {
      const { status, data } = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        page: i,
        per_page: per_page,
      })
      if (status === 200) {
        // console.log('data', data)
        list.push(...data)
      } else {
        console.log('fail', status)
      }
    }
    processMd({ data: list })
  } catch (e) {
    console.log('fetch', e.toString())
  }
}
init()
