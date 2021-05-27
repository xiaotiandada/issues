"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rest_1 = require("@octokit/rest");
// https://docs.github.com/en/rest/reference/issues#list-repository-issues
// https://docs.github.com/en/rest/reference/issues#list-repository-issues
const octokit = new rest_1.Octokit({
    auth: ''
});
/**
 * push markdown
 * @param contents 文垱内容
 * @returns
 */
const push = async (contents) => {
    let repoInfo = {
        owner: 'xiaotiandada',
        repo: 'blog',
        path: 'README.md',
    };
    try {
        const { status, data } = await octokit.repos.getContent({
            ...repoInfo
        });
        if (status !== 200) {
            console.log('fail', status);
            return;
        }
        const contentsBase64 = new Buffer(contents).toString('base64');
        const { status: pushStatus, data: pushData } = await octokit.repos.createOrUpdateFileContents({
            ...repoInfo,
            message: `Update ${Date.now()}`,
            content: contentsBase64,
            sha: data.sha,
        });
        if (pushStatus === 200) {
            console.log(`push success, url: ${pushData.content.html_url}`);
        }
        else {
            console.log('fail', pushStatus);
        }
    }
    catch (e) {
        console.log(e.toString());
    }
};
/**
 * process markdown
 * @param data issues list
 */
const processMd = (data) => {
    let md = '';
    data.map((i) => {
        md += `[#${i.number} ${i.title}](${i.html_url})\n\n`;
    });
    push(md);
};
/**
 * fetch issues
 */
const fetch = async () => {
    try {
        const { status, data } = await octokit.rest.issues.listForRepo({
            owner: 'xiaotiandada',
            repo: 'blog',
        });
        // console.log('data', data)
        if (status === 200) {
            processMd(data);
        }
        else {
            console.log('fail', status);
        }
    }
    catch (e) {
        console.log(e.toString());
    }
};
fetch();
