import Heading from '@theme/Heading';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import styles from './styles.module.css';

type FeatureItem =
  | {
      title: string;
      Svg: React.ComponentType<React.ComponentProps<'svg'>>;
      description: ReactNode;
    }
  | {
      title: string;
      imageSrc: string;
      description: ReactNode;
    };

const FeatureList: FeatureItem[] = [
  {
    title: 'Real Browser Testing, Powered by Playwright',
    Svg: require('@site/static/img/playwright.svg').default,
    description: (
      <>
        Testronaut runs your components in a real browser — powered by
        <strong>Playwright</strong> — using your framework's actual build
        process. No guesswork. Just real UI.
      </>
    ),
  },
  {
    title: 'No More Guesswork',
    Svg: require('@site/static/img/target.svg').default,
    description: (
      <>
        Testronaut handles DOM events, and async behavior for you. Focus on what
        your component should do — not how to make the test environment behave.
      </>
    ),
  },
  {
    title: 'Built for Angular (for now)',
    imageSrc: '/img/angular.png',
    description: (
      <>
        Testronaut is designed to support any frontend framework. But to start,
        we're going deep on Angular.
      </>
    ),
  },
];

function Feature(featureItem: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        {featureItem.Svg && (
          <featureItem.Svg
            className={styles.featureSvg}
            role="img"
            alt={featureItem.title}
          />
        )}
        {featureItem.imageSrc && (
          <img
            className={styles.featureSvg}
            role="img"
            alt={featureItem.title}
            src={featureItem.imageSrc}
          />
        )}
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{featureItem.title}</Heading>
        <p>{featureItem.description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
