import File from "../models/file.model.js";
import { buildTree } from "../utils/tree.js";

export const createRootFolder = async (req, res) => {
  try {
    const { projectId, projectName } = req.body;
    const userId=req.headers["x-user-id"]
    if (!projectId || !projectName) {
      return res.status(400).json({
        success: false,
        message: "Project ID and Project Name are required",
      });
    }

    // Check if root already exists
    const existingRoot = await File.findOne({
      projectId,
      parentId: null,
      isDeleted: false,
    });

    if (existingRoot) {
      return res.status(409).json({
        success: false,
        message: "Root folder already exists",
      });
    }

    const rootFolder = await File.create({
      owner:userId,
      projectId,
      parentId: null,
      name: projectName,
      type: "folder",
    });

    return res.status(201).json({
      success: true,
      rootFolder,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};






export const getProjectTree = async (req, res) => {
  try {
    const { projectId } = req.params;
 const userId=req.headers["x-user-id"]
    const files = await File.find({
      projectId,
      owner: userId,
      isDeleted: false,
    }).sort({
      type: -1,
      name: 1,
    });
    console.log(projectId)
    const tree = buildTree(files);
    console.log(tree)

    return res.json({
      success: true,
      tree,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getFile = async (req, res) => {
  try {
     const userId=req.headers["x-user-id"]
    const file = await File.findOne({
      _id: req.params.id,
      owner: userId,
      isDeleted: false,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    return res.json({
      success: true,
      file,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




export const createFolder = async (req, res) => {
  try {
  const userId=req.headers["x-user-id"]
    const {
      projectId,
      parentId,
      name
    } = req.body;

    if (!projectId || !name) {
      return res.status(400).json({
        success:false,
        message:"Missing required fields"
      });
    }

    const exists = await File.findOne({
      projectId,
      parentId: parentId || null,
      name,
      isDeleted:false
    });

    if (exists) {
      return res.status(409).json({
        success:false,
        message:"Folder already exists"
      });
    }

    const folder = await File.create({
      owner:userId,
      projectId,
      parentId: parentId || null,
      name,
      type:"folder"
    });

    res.status(201).json({
      success:true,
      folder
    });

  } catch (error) {

    res.status(500).json({
      success:false,
      message:error.message
    });

  }
};


export const createFile = async (req,res)=>{
  const userId=req.headers["x-user-id"]
    try{

        const {
            projectId,
            parentId,
            name,
            language="plaintext",
            content=""
        }=req.body;

        const exists=await File.findOne({
            projectId,
            parentId:parentId||null,
            name,
            isDeleted:false
        });

        if(exists){

            return res.status(409).json({
                success:false,
                message:"File already exists"
            })

        }

        const extension=name.includes(".")
            ?name.split(".").pop()
            :"";

        const file=await File.create({

            owner:userId,

            projectId,

            parentId:parentId||null,

            name,

            type:"file",

            extension,

            language,

            content,

            size:content.length

        });

        res.status(201).json({
            success:true,
            file
        })

    }

    catch(error){

        res.status(500).json({
            success:false,
            message:error.message
        })

    }

}



export const updateFile = async (req,res)=>{
  const userId=req.headers["x-user-id"]
    try{

        const file=await File.findOne({

            _id:req.params.id,

            owner:userId,

            isDeleted:false

        });

        if(!file){

            return res.status(404).json({
                success:false,
                message:"Not Found"
            })

        }

        const {
            name,
            content
        }=req.body;

        if(name){

            file.name=name;

            file.extension=name.includes(".")
            ?name.split(".").pop()
            :"";

        }

        if(content!==undefined){

            file.content=content;

            file.size=content.length;

        }

        await file.save();

        res.json({

            success:true,

            file

        })

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        })

    }

}




export const deleteFile = async (req,res)=>{
  const userId=req.headers["x-user-id"]
    try{

        await File.findByIdAndUpdate(

            req.params.id,

            {

                isDeleted:true

            }

        );

        res.json({

            success:true

        })

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        })

    }

}