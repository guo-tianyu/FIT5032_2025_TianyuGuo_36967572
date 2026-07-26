<template>
  <header class="site-header">
    <nav class="navbar navbar-expand-lg" aria-label="Main navigation">
      <div class="container py-2">
        <RouterLink class="navbar-brand" to="/">StudyWell Connect</RouterLink>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavigation" aria-controls="mainNavigation" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div id="mainNavigation" class="collapse navbar-collapse">
          <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            <li class="nav-item"><RouterLink class="nav-link" to="/">Home</RouterLink></li>
            <li class="nav-item"><RouterLink class="nav-link" to="/resources">Resources</RouterLink></li>
            <li class="nav-item"><RouterLink class="nav-link" to="/support">Support</RouterLink></li>
            <li class="nav-item"><RouterLink class="nav-link" to="/workshops">Workshops</RouterLink></li>
            <li class="nav-item ms-lg-2"><RouterLink class="btn btn-brand" to="/auth">Sign in</RouterLink></li>
          </ul>
        </div>
      </div>
    </nav>
  </header>
</template>
