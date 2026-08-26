import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      maxlength: 500,
    },


    icon: {
      type: String,
      default: "📁",
    },

    color: {
      type: String,
      default: "#3B82F6",
    },

    starred: {
      type: Boolean,
      default: false,
    },


    lastOpenedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Project= mongoose.model("Project", projectSchema);
export default Project