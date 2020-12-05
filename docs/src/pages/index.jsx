import Layout from '@theme/Layout'
import Link from '@docusaurus/Link'
import React from 'react'
import clsx from 'clsx'
import styles from './styles.module.css'
import { Watch, Database, Code, UserCheck } from 'react-feather'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import useBaseUrl from '@docusaurus/useBaseUrl'

const features = [
    {
        title: 'Easy to Use',
        icon: UserCheck,
        description: (
            <>
                React Async Storage offers powerful functionalities while
                extending the familiar and simple to use localStorage API.
            </>
        ),
    },
    {
        title: 'React and React Native',
        icon: Code,
        description: (
            <>
                React Async Storage works in both the browser and React Native,
                allowing you to share code across platforms more easily.
            </>
        ),
    },
    {
        title: 'Cache Invalidation',
        icon: Watch,
        description: (
            <>
                React Async Storage supports record expiration and storage
                versioning.
            </>
        ),
    },
    {
        title: 'Extends LocalForage',
        icon: Database,
        description: (
            <>
                React Async Storage is build on-top of localForage and it
                includes all of its advanced functionalities.
            </>
        ),
    },
]

function Feature({ icon: Icon, title, description }) {
    return (
        <div className={clsx('col col--3', styles.feature)}>
            <Icon size={96} />
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    )
}

function Home() {
    const context = useDocusaurusContext()
    const { siteConfig = {} } = context
    return (
        <Layout
            title={`Hello from ${siteConfig.title}`}
            description="Description will go into a meta tag in <head />"
        >
            <header className={clsx('hero hero--primary', styles.heroBanner)}>
                <div className="container">
                    <h1 className="hero__title">{siteConfig.title}</h1>
                    <p className="hero__subtitle">{siteConfig.tagline}</p>
                    <div className={styles.buttons}>
                        <Link
                            className={clsx(
                                'button button--outline button--secondary button--lg',
                                styles.getStarted,
                            )}
                            to={useBaseUrl('docs/')}
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>
            <main>
                <section className={styles.features}>
                    <div className="container">
                        <div className={clsx('row')}>
                            {features.map((props, idx) => (
                                <Feature key={idx} {...props} />
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </Layout>
    )
}

export default Home
