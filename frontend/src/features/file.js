import api from "../utils/axios";


export const getTree = async(projectId)=>{

    const {data}=await api.get(

        `/api/file/tree/${projectId}`

    );
 console.log(data)
    return data;

}

export const getFile=async(id)=>{

    const {data}=await api.get(

        `/api/file/${id}`

    );

    return data;

}

export const updateFile=async(id,content)=>{

    const {data}=await api.put(

        `/api/file/${id}`,

        {

            content

        }

    );

    return data;

}


export const createRoot = async (body) => {
    const { data } = await api.post(
        "/api/file/root",
        body
    );

    return data;
};

export const createFolder = async (body) => {
  const { data } = await api.post(
    "/api/file/folder",
    body
  );

  return data;
};
export const createFile = async (body) => {
  const { data } = await api.post(
    "/api/file/file",
    body
  );

  return data;
};