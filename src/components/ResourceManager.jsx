import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, X } from 'lucide-react';

/**
 * ResourceManager Component
 * Manages the list of resources (links) for a hackathon
 * Allows adding and removing resources dynamically
 * 
 * @param {Array} resources - Current list of resources
 * @param {Function} onChange - Callback when resources change
 */
const ResourceManager = ({ resources, onChange }) => {
  const [newResource, setNewResource] = useState({
    label: '',
    url: '',
    type: 'Other'
  });

  // Resource type options
  const resourceTypes = ['GitHub', 'Canva', 'PPT', 'Drive', 'Other'];

  /**
   * Add a new resource to the list
   */
  const handleAddResource = () => {
    // Validation
    if (!newResource.label.trim() || !newResource.url.trim()) {
      alert('Please fill in both label and URL');
      return;
    }

    // Add URL protocol if missing
    let formattedUrl = newResource.url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const resource = {
      id: Date.now().toString(),
      label: newResource.label.trim(),
      url: formattedUrl,
      type: newResource.type
    };

    onChange([...resources, resource]);

    // Reset form
    setNewResource({
      label: '',
      url: '',
      type: 'Other'
    });
  };

  /**
   * Remove a resource from the list
   * @param {string} id - The ID of the resource to remove
   */
  const handleRemoveResource = (id) => {
    onChange(resources.filter(r => r.id !== id));
  };

  /**
   * Handle Enter key press to add resource
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddResource();
    }
  };

  return (
    <div className="space-y-4">
      {/* Resource List */}
      {resources.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {resources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-200 truncate">
                    {resource.label}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-gray-600 text-gray-300 rounded">
                    {resource.type}
                  </span>
                </div>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-400 hover:text-primary-300 truncate block"
                >
                  {resource.url}
                </a>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleRemoveResource(resource.id)}
                className="p-1.5 bg-red-600 hover:bg-red-700 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="Remove resource"
              >
                <Trash2 size={14} />
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Resource Form */}
      <div className="border-t border-gray-700 pt-4">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Add Resource
        </label>
        <div className="space-y-3">
          {/* Resource Label */}
          <input
            type="text"
            placeholder="Resource Label (e.g., 'GitHub Repository')"
            value={newResource.label}
            onChange={(e) => setNewResource({ ...newResource, label: e.target.value })}
            onKeyPress={handleKeyPress}
            className="input"
          />

          {/* Resource URL */}
          <input
            type="text"
            placeholder="URL (e.g., 'github.com/username/repo')"
            value={newResource.url}
            onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
            onKeyPress={handleKeyPress}
            className="input"
          />

          {/* Resource Type */}
          <div className="flex gap-2">
            <select
              value={newResource.type}
              onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
              className="select flex-1"
            >
              {resourceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Add Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddResource}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              Add
            </motion.button>
          </div>
        </div>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-500 italic">
        Add links to your GitHub repos, Canva designs, presentations, and other resources.
      </p>
    </div>
  );
};

export default ResourceManager;
