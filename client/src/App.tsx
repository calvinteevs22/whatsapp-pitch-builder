import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Builder from "./pages/Builder";
import SharedThread from "./pages/SharedThread";
import Samples from "./pages/Samples";
import ROICalculator from "./pages/ROICalculator";
import ApiDocs from "./pages/ApiDocs";
import QuickCreate from "./pages/QuickCreate";
import Login from "./pages/Login";
import Pricing from "./pages/Pricing";
import Account from "./pages/Account";
import ResetPassword from "./pages/ResetPassword";
import { FeedbackWidget } from "./components/FeedbackWidget";

function Router() {
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/account"} component={Account} />
      <Route path={"/reset-password"} component={ResetPassword} />
      <Route path={"/"} component={Home} />
      <Route path={"/threads"} component={Dashboard} />
      <Route path={"/templates"} component={Samples} />
      <Route path={"/roi-calculator"} component={ROICalculator} />
      <Route path={"/api-docs"} component={ApiDocs} />
      <Route path={"/create"} component={QuickCreate} />
      <Route path={"/builder/:uid"} component={Builder} />
      <Route path={"/shared/:token"} component={SharedThread} />
      {/* Legacy redirects */}
      <Route path={"/dashboard"}>{() => <Redirect to="/threads" />}</Route>
      <Route path={"/samples"}>{() => <Redirect to="/templates" />}</Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <FeedbackWidget />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
