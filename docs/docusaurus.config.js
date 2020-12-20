const title = 'React Async Storage'
const organizationName = 'react-async-storage'
const githubLink = 'https://github.com/react-async-storage/react-async-storage'
module.exports = {
    title,
    organizationName,
    projectName: `${organizationName}.github.io`,
    url: `https://${organizationName}.github.io`,
    baseUrl: `/${organizationName}/`,
    tagline: 'Ergonomic Async Storage for React and React Native',
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/favicon.ico',
    themeConfig: {
        prism: {
            theme: require('prism-react-renderer/themes/dracula'),
            darkTheme: require('prism-react-renderer/themes/dracula'),
        },
        navbar: {
            title,
            logo: {
                alt: title,
                src: 'img/logo.png',
            },
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
            copyright: `Copyright © ${new Date().getFullYear()} ${title}. Built with Docusaurus.`,
        },
    },
    presets: [
        [
            '@docusaurus/preset-classic',
            {
                docs: {
                    sidebarPath: require.resolve('./sidebars.js'),
                },
                theme: {
                    customCss: require.resolve('./src/css/custom.css'),
                },
            },
        ],
    ],
}
