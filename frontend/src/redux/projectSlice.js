import { createSlice } from "@reduxjs/toolkit";

const projectSlice=createSlice({
    name:"user",
    initialState:{
      projects: [],
  currentProject: null,
  loading: false,
    },
    reducers:{
       setProjects:(state,action)=>{
        state.projects=action.payload
       },
        setCurrentProject:(state,action)=>{
        state.currentProject=action.payload
       },
        setLoading:(state,action)=>{
        state.loading=action.payload
       },

        starProject:(state,action)=>{
        const project=state.projects.find(p=>p._id==action.payload)
        if(project){
            project.starred=!project.starred
        }
       },
       setDeleteProject:(state,action)=>{
        state.projects=state.projects.filter(p=>p._id!=action.payload)
       }

    }
   
})

export const {setProjects,setCurrentProject,setLoading,starProject,setDeleteProject}=projectSlice.actions 
export default projectSlice.reducer
