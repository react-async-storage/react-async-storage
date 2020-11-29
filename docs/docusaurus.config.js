const title = 'React Async Cache'
const githubLink = 'https://github.com/Goldziher/r-cache.git'
module.exports = {
    title,
    tagline: 'Ergonomic Async Storage for React and React Native',
    url: 'https://your-docusaurus-test-site.com',
    baseUrl: '/',
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/favicon.ico',
    organizationName: title,
    projectName: 'r-cache',
    plugins: [
        [
            'docusaurus-plugin-typedoc',
            {
                inputFiles: ['../src/'],
                mode: 'files',
                excludeExternals: true,
                excludePrivate: true,
                excludeNotExported: true,
                esModuleInterop: true,
                jsx: 'react',
                readme: 'none',
                sidebar: {
                    globalsLabel: 'Overview',
                },
                globalsTitle: 'Overview',
            },
        ],
    ],
    themeConfig: {
        navbar: {
            title,
            items: [
                {
                    to: 'docs/',
                    activeBasePath: 'docs',
                    label: 'Docs',
                    position: 'left',
                },
                {
                    href: githubLink,
                    label: 'GitHub',
                    position: 'right',
                },
            ],
        },
        footer: {
            style: 'dark',
            copyright: `Copyright © ${new Date().getFullYear()} Na'aman Hirschfeld. Built with Docusaurus.`,
        },
    },
    presets: [
        [
            '@docusaurus/preset-classic',
            {
                docs: {
                    sidebarPath: require.resolve('./sidebars.js'),
                    // Please change this to your repo.
                    editUrl:
                        'https://github.com/facebook/docusaurus/edit/master/website/',
                },
                theme: {
                    customCss: require.resolve('./src/css/custom.css'),
                },
            },
        ],
    ],
}
