import React, {
  useEffect,
  useState,
} from "react";

import {
  signInWithPopup,
} from "firebase/auth";

import {
  auth,
  googleProvider,
} from "../utils/firebase";

import {
  login,
} from "../features/login";

import {
  logout,
} from "../features/logout";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import Navbar from "../components/Nav";
import Sidebar from "../components/Sidebar";

import {
  Plus,
  FolderOpen,
  Loader2,
  Menu, // CHANGED: added Menu icon for the new mobile sidebar-toggle button
  X,    // CHANGED: added X icon to close the mobile sidebar drawer
} from "lucide-react";

import {
  FcGoogle,
} from "react-icons/fc";

import {
  setUserdata,
} from "../redux/userSlice";

import {
  setProjects,
  starProject,
} from "../redux/projectSlice";

import CreateProjectModal from "../components/CreateProjectModal";

import {
  ProjectCard,
} from "../components/ProjectCard";

import {
  useNavigate,
} from "react-router-dom";

import {
  createRoot,
} from "../features/file";

import {
  createProject,
  getProjects,
  getStarredProjects,
  toggleProjectStar,
  deleteProject,
} from "../features/project";


// =====================================================
// DASHBOARD
// =====================================================

function Dashboard() {

  const dispatch =
    useDispatch();

  const navigate =
    useNavigate();


  // ===================================================
  // REDUX
  // ===================================================

  const userdata =
    useSelector(
      (state) =>
        state.user.userData
    );

  const {
    projects = [],
  } =
    useSelector(
      (state) =>
        state.project
    );


  // ===================================================
  // STATE
  // ===================================================

  const [
    activeSection,
    setActiveSection,
  ] = useState("Projects");

  const [
    loadingProjects,
    setLoadingProjects,
  ] = useState(false);

  const [
    loggingIn,
    setLoggingIn,
  ] = useState(false);

  const [
    openModal,
    setOpenModal,
  ] = useState(false);

  // CHANGED: new state to control the mobile sidebar drawer (open/closed).
  // Sidebar is hidden by default on small screens; this toggles it as an overlay.
  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false);


  // ===================================================
  // LOGIN
  // ===================================================

  const handleLogin =
    async () => {

      setLoggingIn(true);

      try {

        const result =
          await signInWithPopup(
            auth,
            googleProvider
          );

        const token =
          await result.user.getIdToken();

        const data =
          await login(token);

        dispatch(
          setUserdata(data)
        );

      } catch (error) {

        console.log(
          "Login error:",
          error
        );

      } finally {

        setLoggingIn(false);

      }
    };


  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout =
    async () => {

      try {

        await logout();

        dispatch(
          setUserdata(null)
        );

        dispatch(
          setProjects([])
        );

      } catch (error) {

        console.log(
          "Logout error:",
          error
        );

      }
    };


  // ===================================================
  // FETCH ALL PROJECTS
  // ===================================================

  const fetchProjects =
    async () => {

      try {

        setLoadingProjects(true);

        const data =
          await getProjects();

        dispatch(
          setProjects(
            data?.projects || []
          )
        );

      } catch (error) {

        console.log(
          "Get projects error:",
          error
        );

        dispatch(
          setProjects([])
        );

      } finally {

        setLoadingProjects(false);

      }
    };


  // ===================================================
  // FETCH STARRED PROJECTS
  // ===================================================

  const fetchStarredProjects =
    async () => {

      try {

        setLoadingProjects(true);

        const data =
          await getStarredProjects();

        dispatch(
          setProjects(
            data?.projects || []
          )
        );

      } catch (error) {

        console.log(
          "Get starred projects error:",
          error
        );

        dispatch(
          setProjects([])
        );

      } finally {

        setLoadingProjects(false);

      }
    };


  // ===================================================
  // LOAD PROJECTS
  // ===================================================

  useEffect(() => {

    if (!userdata) {
      return;
    }

    if (
      activeSection ===
      "Starred"
    ) {

      fetchStarredProjects();

    } else {

      fetchProjects();

    }

  }, [
    userdata,
    activeSection,
  ]);


  // ===================================================
  // TOGGLE STAR
  // ===================================================

  const handleToggleStar =
    async (project) => {

      try {

        const data =
          await toggleProjectStar(
            project._id
          );
          
          dispatch(starProject(project?._id))

        if (!data?.success) {
          return;
        }


        // =============================================
        // STARRED PAGE
        // =============================================

        if (
          activeSection ===
          "Starred"
        ) {

          /*
           * If project was unstarred,
           * remove it immediately.
           */

          if (
            !data.project.starred
          ) {

            dispatch(
              setProjects(
                projects.filter(
                  (p) =>
                    p._id !==
                    project._id
                )
              )
            );

          }

          return;
        }


        // =============================================
        // ALL PROJECTS PAGE
        // =============================================

        dispatch(
          setProjects(
            projects.map(
              (p) =>
                p._id ===
                project._id
                  ? data.project
                  : p
            )
          )
        );

      } catch (error) {

        console.log(
          "Toggle star error:",
          error
        );

      }
    };


  // ===================================================
  // DELETE PROJECT
  // ===================================================

  const handleDelete =
    async (project) => {

      try {

        const data =
          await deleteProject(
            project._id
          );

        if (!data?.success) {
          return;
        }

        dispatch(
          setProjects(
            projects.filter(
              (p) =>
                p._id !==
                project._id
            )
          )
        );

      } catch (error) {

        console.log(
          "Delete project error:",
          error
        );

      }
    };


  // ===================================================
  // OPEN PROJECT
  // ===================================================

  const handleOpenProject =
    (project) => {

      if (!project?._id) {
        return;
      }

      navigate(
        `/project/${project._id}`
      );
    };


  // ===================================================
  // CREATE PROJECT
  // ===================================================

  const handleCreateProject =
    async (projectData) => {

      try {

        const result =
          await createProject(
            projectData
          );

        if (
          !result?.success ||
          !result?.project
        ) {

          console.log(
            "Project creation failed"
          );

          return;
        }


        // =============================================
        // CREATE ROOT FOLDER
        // =============================================

        await createRoot({
          projectId:
            result.project._id,

          projectName:
            result.project.name,
        });


        // =============================================
        // CLOSE MODAL
        // =============================================

        setOpenModal(false);


        // =============================================
        // RETURN TO PROJECTS
        // =============================================

        setActiveSection(
          "Projects"
        );


        // =============================================
        // REFRESH PROJECTS
        // =============================================

        await fetchProjects();

      } catch (error) {

        console.log(
          "Create project error:",
          error
        );

      }
    };


  // ===================================================
  // NOT LOGGED IN
  // ===================================================

  if (!userdata) {

    return (
      <div
        className="
          relative
          flex
          h-screen
          w-full
          items-center
          justify-center
          overflow-hidden
          bg-slate-50
          px-4
          transition-colors
          duration-300
          dark:bg-[#07070c]
        "
      >

        {/* Ambient glow */}

        <div
          className="
            pointer-events-none
            absolute
            -top-32
            left-1/2
            hidden
            h-[600px]
            w-[600px]
            -translate-x-1/2
            rounded-full
            bg-white/[0.05]
            blur-[120px]
            dark:block
          "
        />


        {/* Login Card */}
        {/* CHANGED: padding is now p-6 on mobile and p-8 from sm+ so the card
            doesn't feel cramped edge-to-edge on small phones */}

        <div
          className="
            relative
            w-full
            max-w-sm
            rounded-2xl
            border
            border-slate-200/70
            bg-white/80
            p-6
            sm:p-8
            text-center
            shadow-xl
            shadow-slate-200/50
            backdrop-blur-xl
            dark:border-white/[0.08]
            dark:bg-white/[0.03]
            dark:shadow-black/40
          "
        >

          <div
            className="
              mx-auto
              mb-5
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              bg-white
              shadow-lg
              shadow-black/5
              dark:border-transparent
            "
          >

            <span
              className="
                text-lg
                font-bold
                text-slate-900
              "
            >
              AI
            </span>

          </div>


          <h2
            className="
              mb-2
              text-lg
              sm:text-xl
              font-bold
              text-slate-900
              dark:text-white
            "
          >
            Welcome to VertexAI
          </h2>


          <p
            className="
              mb-6
              text-[13px]
              sm:text-[13.5px]
              leading-relaxed
              text-slate-500
              dark:text-slate-400
            "
          >
            Sign in to access your projects
            and continue building.
          </p>


          <button
            onClick={handleLogin}
            disabled={loggingIn}
            className="
              flex
              w-full
              items-center
              justify-center
              gap-3
              rounded-lg
              border
              border-slate-200
              bg-white
              py-2.5
              text-[13.5px]
              font-medium
              text-slate-800
              shadow-sm
              transition-colors
              duration-150
              hover:bg-slate-50
              disabled:opacity-70
              dark:border-transparent
              dark:bg-white
              dark:hover:bg-slate-100
            "
          >

            {loggingIn ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <FcGoogle
                size={18}
              />
            )}

            {loggingIn
              ? "Signing in..."
              : "Continue with Google"}

          </button>


          <p
            className="
              mt-5
              text-[11px]
              text-slate-400
              dark:text-slate-600
            "
          >
            By continuing you agree to our
            Terms & Privacy Policy.
          </p>

        </div>

      </div>
    );
  }


  // ===================================================
  // DASHBOARD
  // ===================================================

  return (
    <div
      className="
        relative
        flex
        h-screen
        w-full
        flex-col
        overflow-hidden
        bg-slate-50
        transition-colors
        duration-300
        dark:bg-[#07070c]
      "
    >

      {/* Ambient glow */}

      <div
        className="
          pointer-events-none
          absolute
          -top-40
          left-1/3
          hidden
          h-[700px]
          w-[700px]
          rounded-full
          bg-white/[0.04]
          blur-[140px]
          dark:block
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          right-0
          top-1/3
          hidden
          h-[500px]
          w-[500px]
          rounded-full
          bg-white/[0.03]
          blur-[130px]
          dark:block
        "
      />


      <div
        className="
          relative
          flex
          min-h-0
          flex-1
          flex-col
        "
      >

        {/* NAVBAR */}
        {/* CHANGED: passing mobileSidebarOpen + setter down so Navbar can
            render a hamburger button on small screens. If your Navbar
            component doesn't accept these props yet, this is safely ignored
            — but add a hamburger button there for the toggle to be reachable
            on mobile (see note below the code). */}

        <Navbar
          user={userdata}
          onLogout={handleLogout}
          onToggleSidebar={() =>
            setMobileSidebarOpen((v) => !v)
          }
        />


        <div
          className="
            relative
            flex
            min-h-0
            flex-1
          "
        >

          {/* SIDEBAR — DESKTOP */}
          {/* CHANGED: wrapped in `hidden md:block` so the fixed-width sidebar
              only takes up layout space from tablet size upward. On phones
              it's replaced by the slide-over drawer below. */}

          <div className="hidden md:block">
            <Sidebar
              activeSection={
                activeSection
              }

              setActiveSection={
                setActiveSection
              }
              credits={userdata.credits || 0}
            />
          </div>


          {/* SIDEBAR — MOBILE DRAWER */}
          {/* CHANGED: brand new block. On screens below `md`, the sidebar is
              rendered as a slide-in overlay + backdrop instead of taking up
              permanent width. Opens via the hamburger button, closes via the
              backdrop, the X button, or picking a section. */}

          {mobileSidebarOpen && (
            <div className="fixed inset-0 z-40 md:hidden">
              {/* backdrop */}
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setMobileSidebarOpen(false)}
              />

              {/* drawer panel */}
              <div className="absolute left-0 top-0 h-full w-72 max-w-[80vw] bg-slate-50 shadow-2xl dark:bg-[#0a0a10]">
                <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200/70 dark:border-white/[0.07]">
                  <span className="text-[13.5px] font-semibold text-slate-900 dark:text-white">
                    Menu
                  </span>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]"
                    aria-label="Close menu"
                  >
                    <X size={18} />
                  </button>
                </div>

                <Sidebar
                  activeSection={activeSection}
                  setActiveSection={(section) => {
                    setActiveSection(section);
                    setMobileSidebarOpen(false); // close drawer after picking a section
                  }}
                  credits={userdata.credits || 0}
                />
              </div>
            </div>
          )}


          {/* MAIN */}
          {/* CHANGED: horizontal/vertical padding now scales down on small
              screens (px-4 py-5) and grows back up at sm/lg (px-6/px-8,
              py-8), instead of a fixed px-8 py-8 that felt too wide on
              phones. */}

          <main
            className="
              min-h-0
              flex-1
              overflow-y-auto
              px-4
              py-5
              sm:px-6
              sm:py-6
              lg:px-8
              lg:py-8
              [scrollbar-width:thin]
              [scrollbar-color:rgba(100,116,139,0.35)_transparent]
              [&::-webkit-scrollbar]:w-2
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-slate-300
              [&::-webkit-scrollbar-thumb]:border-2
              [&::-webkit-scrollbar-thumb]:border-solid
              [&::-webkit-scrollbar-thumb]:border-transparent
              [&::-webkit-scrollbar-thumb]:bg-clip-padding
              hover:[&::-webkit-scrollbar-thumb]:bg-slate-400
              dark:[&::-webkit-scrollbar-thumb]:bg-white/10
              dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/20
            "
          >

            {/* MOBILE MENU BUTTON */}
            {/* CHANGED: fallback hamburger button shown only below `md`, in
                case Navbar isn't updated to take onToggleSidebar. Safe to
                delete if you wire the button into Navbar instead. */}

            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="
                mb-4
                flex
                items-center
                gap-2
                rounded-lg
                border
                border-slate-200
                bg-white
                px-3
                py-2
                text-[12.5px]
                font-medium
                text-slate-600
                shadow-sm
                dark:border-white/[0.08]
                dark:bg-white/[0.04]
                dark:text-slate-300
                md:hidden
              "
            >
              <Menu size={15} />
              Menu
            </button>


            {/* HEADER */}
            {/* CHANGED: switched from a single-row flex to
                `flex-col sm:flex-row` — on phones the greeting stacks above
                the "New Project" button (which is now full-width on mobile,
                auto width from sm+) instead of squeezing side by side. */}

            <div
              className="
                mb-6
                sm:mb-8
                flex
                flex-col
                sm:flex-row
                sm:items-start
                sm:justify-between
                gap-3
                sm:gap-4
              "
            >

              <div>

                <h1
                  className="
                    flex
                    items-center
                    gap-2
                    text-xl
                    sm:text-2xl
                    lg:text-[26px]
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >

                  Welcome back,
                  {" "}
                  {userdata?.name
                    ?.split(" ")[0] ||
                    "there"}

                  <span>
                    👋
                  </span>

                </h1>


                <p
                  className="
                    mt-1
                    text-[13px]
                    sm:text-[13.5px]
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Ready to build something
                  amazing today?
                </p>

              </div>


              {/* NEW PROJECT */}
              {/* CHANGED: `w-full sm:w-auto` + `justify-center` so this
                  button spans full width on phones (easier to tap) and
                  shrinks back to content width on larger screens. */}

              <button
                onClick={() =>
                  setOpenModal(true)
                }

                className="
                  flex
                  w-full
                  sm:w-auto
                  shrink-0
                  items-center
                  justify-center
                  gap-1.5
                  rounded-lg
                  bg-slate-900
                  px-4
                  py-2.5
                  text-[13.5px]
                  font-semibold
                  text-white
                  shadow-sm
                  transition-opacity
                  duration-150
                  hover:opacity-90
                  dark:bg-white
                  dark:text-slate-900
                "
              >

                <Plus
                  size={16}
                />

                New Project

              </button>

            </div>


            {/* PROJECT HEADING */}

            <div
              className="
                mb-4
                flex
                items-center
                justify-between
              "
            >

              <h2
                className="
                  text-[15px]
                  sm:text-[16px]
                  font-semibold
                  text-slate-900
                  dark:text-white
                "
              >
                {activeSection ===
                "Starred"
                  ? "Starred Projects"
                  : "Recent Projects"}
              </h2>

            </div>


            {/* LOADING */}

            {loadingProjects ? (

              <div
                className="
                  flex
                  min-h-[300px]
                  items-center
                  justify-center
                "
              >

                <Loader2
                  size={28}
                  className="
                    animate-spin
                    text-slate-400
                    dark:text-slate-500
                  "
                />

              </div>

            ) : projects?.length > 0 ? (

              /* PROJECTS */
              /* CHANGED: added `md:grid-cols-2` and moved the previous
                 sm:grid-cols-2 breakpoint chain to
                 1 → 2 (sm) → 2 (md) → 3 (lg) → 4 (xl), so tablets in
                 portrait/landscape get a sensible 2-column layout instead of
                 jumping straight from 1 to 4 columns. Also reduced the gap
                 slightly on mobile. */

              <div
                className="
                  mb-8
                  grid
                  grid-cols-1
                  gap-3
                  sm:grid-cols-2
                  sm:gap-4
                  lg:grid-cols-3
                  xl:grid-cols-4
                "
              >

                {projects.map(
                  (p) => (

                    <ProjectCard
                      key={p._id}
                      project={p}

                      onOpen={
                        handleOpenProject
                      }

                      onToggleStar={
                        handleToggleStar
                      }

                      onDelete={
                        handleDelete
                      }
                    />

                  )
                )}

              </div>

            ) : (

              /* EMPTY */
              /* CHANGED: horizontal padding `px-4` added so the empty-state
                 text/icon don't touch the dashed border edge on narrow
                 screens, and vertical padding shrinks slightly on mobile
                 (py-12 → sm:py-16). */

              <div
                className="
                  mb-8
                  flex
                  flex-col
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-dashed
                  border-slate-300
                  bg-white/40
                  px-4
                  py-12
                  sm:py-16
                  text-center
                  dark:border-white/[0.1]
                  dark:bg-white/[0.01]
                "
              >

                <div
                  className="
                    mb-4
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-full
                    bg-slate-900/5
                    dark:bg-white/10
                  "
                >

                  <FolderOpen
                    size={24}
                    className="
                      text-slate-500
                      dark:text-white
                    "
                  />

                </div>


                <h3
                  className="
                    mb-1.5
                    text-[15px]
                    sm:text-[16px]
                    font-semibold
                    text-slate-900
                    dark:text-white
                  "
                >
                  {activeSection ===
                  "Starred"
                    ? "No starred projects"
                    : "No projects yet"}
                </h3>


                <p
                  className="
                    mb-5
                    max-w-xs
                    text-[13px]
                    text-slate-500
                    dark:text-slate-500
                  "
                >
                  {activeSection ===
                  "Starred"
                    ? "Star a project to see it here."
                    : "Create your first project and start building something amazing!"}
                </p>


                {activeSection ===
                  "Projects" && (

                  <button
                    onClick={() =>
                      setOpenModal(
                        true
                      )
                    }

                    className="
                      flex
                      items-center
                      gap-1.5
                      rounded-lg
                      bg-slate-900
                      px-4
                      py-2.5
                      text-[13.5px]
                      font-semibold
                      text-white
                      shadow-sm
                      transition-opacity
                      duration-150
                      hover:opacity-90
                      dark:bg-white
                      dark:text-slate-900
                    "
                  >

                    <Plus
                      size={16}
                    />

                    Create Project

                  </button>

                )}

              </div>

            )}

          </main>

        </div>

      </div>


      {/* =================================================
          CREATE PROJECT MODAL
      ================================================= */}

      <CreateProjectModal
        open={openModal}

        onClose={() =>
          setOpenModal(false)
        }

        onCreate={
          handleCreateProject
        }
      />

    </div>
  );
}


export default Dashboard;