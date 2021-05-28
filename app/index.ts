import { Octokit } from '@octokit/rest';
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types";

type listForRepoType = RestEndpointMethodTypes["issues"]["listForRepo"]["parameters"]

// https://docs.github.com/en/rest/reference/issues#list-repository-issues
// https://octokit.github.io/rest.js/v18

const octokit = new Octokit({
  auth: process.env.TOKEN
});
const owner = 'xiaotiandada'
const repo = 'blog'
const path = 'README.md'

/**
 * push markdown
 * @param contents 文垱内容
 * @returns
 */
const push = async (contents: string) => {
  try {
    const { status, data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });
    // console.log(data)

    if (status !== 200) {
      console.log('fail', status)
      return
    }

    const contentsBase64 = new Buffer(contents).toString('base64');
    const { status: pushStatus, data: pushData } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Update ${Date.now()}`,
      content: contentsBase64,
      sha: data.sha,
    });
    if (pushStatus === 200) {
    // console.log(pushData)
      console.log(`push success, url: ${pushData.content.html_url}`)
    } else {
      console.log('fail', pushStatus)
    }
  } catch (e) {
    console.log('push', e.toString())
  }
}
/**
 * process markdown
 * @param data issues list
 */
const processMd = ({data, name, description}: { data: Array<listForRepoType>, name: string, description: string }) => {
  let md =
`<div align="center">
<h1>${name}</h1>
<p>${description}</p>
</div>\n\n`

  data.map((i) => {
    let label = ''
    let labels: any = i.labels
    for (let i = 0; i < labels.length; i++) {
      const ele: { name: string } = labels[i];
      label += ` ${ele.name} `
    }
    // [xxx](xxx) [ xx ]
    md += `[#${i.number} ${i.title}](${i.html_url}) ${ label ? '[' + label + ']' : '' }\n\n`
  })

  // console.log('md', md)
  push(md)
}
/**
 * get repo
 */
const getRepo = async () => {
  try {
    const { status, data } = await octokit.rest.repos.get({
      owner,
      repo,
    });
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
 * fetch issues
 */
const fetch = async () => {
  try {

    const respo = await getRepo()
    let count = (respo as any).open_issues_count
    let per_page = 100 // default 30 max 100
    let len = Math.floor(count / per_page) + 1

    let list: listForRepoType[] = []
    for (let i = 1; i <= len; i++) {
      const { status, data } = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        page: i,
        per_page: per_page
      });
      if (status === 200) {
        // console.log('data', data)
        list.push(...(data as any))
      } else {
        console.log('fail', status)
      }
    }

    processMd({
      data: list,
      name: (respo as any).name,
      description: (respo as any).description,
    })
  } catch (e) {
    console.log('fetch', e.toString())
  }
}

fetch()