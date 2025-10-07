import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";

const FormField = ({ 
  label, 
  type = "text", 
  error, 
  required,
  options,
  ...props 
}) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {type === "select" ? (
        <Select error={error} {...props}>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ) : type === "textarea" ? (
        <textarea
          className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 placeholder:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed"
          {...props}
        />
      ) : (
        <Input type={type} error={error} {...props} />
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default FormField;