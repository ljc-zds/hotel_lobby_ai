import { publicVideoExample as example } from '@/config/public-example';
import { m } from '@/paraglide/messages.js';
import { getHotelTracks } from '@/blocks/hotel-tracks';

import '@/styles/hotel-trust.css';

export function HotelActualExample() {
  const template = getHotelTracks().find(
    (track) => track.id === example.templateId
  );
  const minutes = Math.ceil(
    (Date.parse(example.firstObservedSuccessAt) -
      Date.parse(example.createdAt)) /
      60_000
  );
  return (
    <section
      className="actual-example container"
      id="actual-example"
      aria-labelledby="actual-example-heading"
    >
      <span className="example-source-label">{m['hotel.proof.label']()}</span>
      <h2 id="actual-example-heading">{m['hotel.proof.heading']()}</h2>
      <p>{m['hotel.proof.intro']()}</p>
      <div className="example-pipeline">
        <div className="example-inputs">
          {example.inputs.map((input, i) => (
            <figure key={input.path}>
              <a
                href={`${example.basePath}/${input.path}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={`${example.basePath}/input-${i + 1}-preview.jpg`}
                  width={384}
                  height={512}
                  loading="lazy"
                  alt={m['hotel.proof.input_alt']({ number: i + 1 })}
                />
              </a>
              <figcaption>
                {m['hotel.proof.input_caption']({ number: i + 1 })}
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="example-result">
          <video
            src={example.video}
            poster={example.poster}
            controls
            playsInline
            preload="none"
            aria-label={m['hotel.proof.video_label']()}
          />
          <p>{m['hotel.proof.unedited']()}</p>
          <a href={example.video} download="hotellobby-first-run-original.mp4">
            {m['hotel.proof.download']()}
          </a>
        </div>
      </div>
      <dl className="example-facts">
        <div>
          <dt>{m['hotel.proof.template']()}</dt>
          <dd>{template?.title ?? example.templateId}</dd>
        </div>
        <div>
          <dt>{m['hotel.proof.model']()}</dt>
          <dd>{example.model}</dd>
        </div>
        <div>
          <dt>{m['hotel.proof.attempts']()}</dt>
          <dd>{example.generationAttempts}</dd>
        </div>
        <div>
          <dt>{m['hotel.proof.actual_file']()}</dt>
          <dd>
            {example.output.width} × {example.output.height} /{' '}
            {example.output.durationSeconds.toFixed(2)}s
          </dd>
        </div>
        <div>
          <dt>{m['hotel.proof.date']()}</dt>
          <dd>{example.createdAt.slice(0, 10)}</dd>
        </div>
      </dl>
      <details className="example-details">
        <summary>{m['hotel.proof.details']()}</summary>
        <p>{m['hotel.proof.method']()}</p>
        <p>{m['hotel.proof.timing']({ minutes })}</p>
        <pre>{example.prompt}</pre>
        <p>{m['hotel.proof.scope']()}</p>
        <a
          href={`${example.basePath}/provenance.json`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {m['hotel.proof.provenance']()}
        </a>
      </details>
    </section>
  );
}
