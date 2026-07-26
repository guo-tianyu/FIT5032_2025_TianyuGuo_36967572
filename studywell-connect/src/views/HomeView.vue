<template>
  <section class="hero-section">
    <div class="container hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">Health support, made clearer</p>
        <h1>Study far from home.<br><em>Feel supported here.</em></h1>
        <p class="hero-lead">StudyWell Connect helps international students understand Australian healthcare, care for their wellbeing and find the right support without the confusion.</p>
        <div class="d-flex flex-column flex-sm-row gap-3 mt-4">
          <RouterLink class="btn btn-brand btn-lg" to="/resources">Explore health guides <span aria-hidden="true">→</span></RouterLink>
          <RouterLink class="btn btn-outline-brand btn-lg" to="/support">Ask for support</RouterLink>
        </div>
        <div class="hero-reassurance">
          <span>✓ Plain English</span><span>✓ Student focused</span><span>✓ Confidential guidance</span>
        </div>
      </div>
      <div class="hero-visual" role="img" aria-label="Abstract illustration representing a student finding health support">
        <div class="visual-sun"></div>
        <div class="visual-arch"></div>
        <div class="visual-person"><span></span><i></i></div>
        <div class="floating-note note-one"><strong>OSHC</strong><small>Know your cover</small></div>
        <div class="floating-note note-two"><strong>GP</strong><small>Find local care</small></div>
        <div class="floating-note note-three"><strong>♡</strong><small>You are not alone</small></div>
      </div>
    </div>
  </section>

  <section class="trust-strip" aria-label="StudyWell Connect benefits">
    <div class="container trust-grid">
      <div><strong>6</strong><span>health topics</span></div>
      <div><strong>Free</strong><span>student workshops</span></div>
      <div><strong>One</strong><span>clear place to start</span></div>
      <p>Practical information for real student life in Australia.</p>
    </div>
  </section>

  <section class="section-space">
    <div class="container">
      <div class="section-heading">
        <div><p class="eyebrow">Start with what you need</p><h2>Health can feel complicated.<br>We make the next step simple.</h2></div>
        <p>From your first GP visit to managing study stress, explore clear pathways designed around international student questions.</p>
      </div>
      <div class="row g-4 service-cards">
        <div class="col-md-4">
          <article class="feature-card card-coral h-100">
            <span class="card-number">01</span><div class="feature-icon" aria-hidden="true">＋</div>
            <h3>Understand healthcare</h3><p>Learn how OSHC, GPs, pharmacies and urgent care work before you need them.</p>
            <RouterLink to="/resources">Browse health guides <span>→</span></RouterLink>
          </article>
        </div>
        <div class="col-md-4">
          <article class="feature-card card-mint h-100">
            <span class="card-number">02</span><div class="feature-icon" aria-hidden="true">☀</div>
            <h3>Look after your wellbeing</h3><p>Find practical resources for study stress, loneliness, sleep and mental health support.</p>
            <RouterLink to="/resources">Explore wellbeing <span>→</span></RouterLink>
          </article>
        </div>
        <div class="col-md-4">
          <article class="feature-card card-gold h-100">
            <span class="card-number">03</span><div class="feature-icon" aria-hidden="true">⌁</div>
            <h3>Connect with support</h3><p>Send a private request or join a free workshop with students who understand.</p>
            <RouterLink to="/workshops">See workshops <span>→</span></RouterLink>
          </article>
        </div>
      </div>
    </div>
  </section>

  <section class="student-story">
    <div class="container story-grid">
      <div class="story-art" aria-hidden="true"><span>“</span><i></i><b></b></div>
      <blockquote>
        <p>“I knew I needed a doctor, but I did not know where to begin. StudyWell explained the steps in words I could understand.”</p>
        <footer><strong>Lina, 19</strong><span>First-year international student in Melbourne</span></footer>
      </blockquote>
    </div>
  </section>

  <section class="section-space">
    <div class="container action-panel">
      <div><p class="eyebrow eyebrow-light">A calmer next step</p><h2>You do not have to work it out alone.</h2></div>
      <RouterLink class="btn btn-light btn-lg" to="/auth">Create a free student account <span aria-hidden="true">→</span></RouterLink>
    </div>
  </section>
</template>
