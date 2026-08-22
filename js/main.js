// js/main.js
import { initTheme } from './utils/theme.js';
import { initRouter, registerRoute, navigate } from './utils/router.js';
import { initLayout } from './ui/layout.js';

// Import views
import { render as homeView } from './views/home.js';
import { render as loginView } from './views/login.js';
import { render as registerView } from './views/register.js';
import { render as profileView } from './views/profile.js';
import { render as catalogView } from './views/catalog.js';
import { render as creatorView } from './views/creator.js';
import { render as creatorFormView } from './views/creator-form.js';
import { render as creatorEditView } from './views/creator-edit.js';
import { render as managerView } from './views/manager.js';
import { render as managerReviewView } from './views/manager-review.js';
import { render as coursePreviewView } from './views/course-preview.js';
import { render as courseDetailView } from './views/course-detail.js';
import { render as quizView } from './views/quiz.js';
import { render as membersView } from './views/members.js';
import { render as myCoursesView } from './views/my-courses.js';
import { render as certificateView } from './views/certificate.js';
import { render as faqView } from './views/faq.js';
import { render as aboutView } from './views/about.js';
import { render as contactView } from './views/contact.js';
import { render as privacyView } from './views/privacy.js';
import { render as teamView } from './views/team.js';
import { render as forgotPasswordView } from './views/forgot-password.js';
import { render as changePasswordView } from './views/change-password.js';
import { render as courseCompleteView } from './views/course-complete.js';

// ลบ supabase auth token เก่า (กันชน)
localStorage.removeItem('sb-uyqpcxnrfueajglwwarp-auth-token');

// Register routes
registerRoute('/home', homeView);
registerRoute('/login', loginView);
registerRoute('/register', registerView);
registerRoute('/profile', profileView);
registerRoute('/courses', catalogView);
registerRoute('/creator', creatorView);
registerRoute('/creator/new', creatorFormView);
registerRoute('/creator/edit/:id', creatorEditView);
registerRoute('/manager', managerView);
registerRoute('/manager/review/:id', managerReviewView);
registerRoute('/complete/:id', courseCompleteView);

// Course Preview & Learning
registerRoute('/course/:id', coursePreviewView);
registerRoute('/learn/:id', courseDetailView);
registerRoute('/quiz/:id', quizView);

registerRoute('/members', membersView);
registerRoute('/my-courses', myCoursesView);
registerRoute('/certificate/:id', certificateView);

// Static pages
registerRoute('/faq', faqView);
registerRoute('/about', aboutView);
registerRoute('/contact', contactView);
registerRoute('/privacy', privacyView);
registerRoute('/team', teamView);

// Auth
registerRoute('/forgot-password', forgotPasswordView);
registerRoute('/change-password', changePasswordView);

document.addEventListener('DOMContentLoaded', () => {
  const appRoot = document.getElementById('app');
  if (!appRoot) return;

  initTheme();
  initLayout(appRoot);
  initRouter();

  if (!window.location.hash) {
    navigate('/home');
  }
});