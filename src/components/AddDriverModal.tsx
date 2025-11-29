import { useState } from "react";
import { X, User, Mail, Phone, Car, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (driverData: {
    name: string;
    email: string;
    phone: string;
    vehicle?: string;
    license?: string;
  }) => void;
  isDarkMode?: boolean;
}

export function AddDriverModal({
  isOpen,
  onClose,
  onSubmit,
  isDarkMode = false,
}: AddDriverModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    vehicle: "",
    license: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        vehicle: "",
        license: "",
      });
      setErrors({});
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      vehicle: "",
      license: "",
    });
    setErrors({});
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: isDarkMode
            ? "rgba(0, 0, 0, 0.7)"
            : "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 60,
        }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 70,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        <Card
          style={{
            width: "100%",
            maxWidth: "32rem",
            backgroundColor: isDarkMode ? "#1a2123" : "#ffffff",
            border: "none",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <CardHeader
            style={{
              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
              padding: "1.25rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    padding: "0.5rem",
                    backgroundColor: isDarkMode
                      ? "rgba(39, 174, 96, 0.2)"
                      : "#d1fae5",
                    borderRadius: "0.5rem",
                  }}
                >
                  <User
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                      color: "#27AE60",
                    }}
                  />
                </div>
                <CardTitle
                  style={{
                    fontSize: "1.125rem",
                    color: isDarkMode ? "#ffffff" : "#222B2D",
                  }}
                >
                  Add New Driver
                </CardTitle>
              </div>
              <button
                onClick={handleClose}
                style={{
                  width: "2rem",
                  height: "2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isDarkMode ? "#e5e7eb" : "#4b5563",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode
                    ? "rgba(75, 85, 99, 0.5)"
                    : "rgba(243, 244, 246, 1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <X style={{ width: "1.25rem", height: "1.25rem" }} />
              </button>
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent
            style={{
              padding: "1.25rem",
              overflowY: "auto",
              flex: 1,
            }}
          >
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Name */}
                <div>
                  <Label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: isDarkMode ? "#f3f4f6" : "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Full Name <span style={{ color: "#dc2626" }}>*</span>
                  </Label>
                  <div style={{ position: "relative" }}>
                    <User
                      style={{
                        position: "absolute",
                        left: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "1rem",
                        height: "1rem",
                        color: isDarkMode ? "#9ca3af" : "#6b7280",
                      }}
                    />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="Enter driver's full name"
                      style={{
                        width: "100%",
                        paddingLeft: "2.5rem",
                        paddingRight: "0.75rem",
                        paddingTop: "0.625rem",
                        paddingBottom: "0.625rem",
                        fontSize: "0.875rem",
                        backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                        borderColor: errors.name
                          ? "#dc2626"
                          : isDarkMode
                          ? "#4b5563"
                          : "#d1d5db",
                        borderWidth: "1px",
                        borderStyle: "solid",
                        borderRadius: "0.375rem",
                        color: isDarkMode ? "#ffffff" : "#111827",
                        outline: "none",
                      }}
                      onFocus={(e) => {
                        if (!errors.name) {
                          e.target.style.borderColor = "#27AE60";
                          e.target.style.boxShadow =
                            "0 0 0 2px rgba(39, 174, 96, 0.2)";
                        }
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.name
                          ? "#dc2626"
                          : isDarkMode
                          ? "#4b5563"
                          : "#d1d5db";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  {errors.name && (
                    <p
                      style={{
                        marginTop: "0.25rem",
                        fontSize: "0.75rem",
                        color: "#dc2626",
                      }}
                    >
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: isDarkMode ? "#f3f4f6" : "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Email Address <span style={{ color: "#dc2626" }}>*</span>
                  </Label>
                  <div style={{ position: "relative" }}>
                    <Mail
                      style={{
                        position: "absolute",
                        left: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "1rem",
                        height: "1rem",
                        color: isDarkMode ? "#9ca3af" : "#6b7280",
                      }}
                    />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="driver@example.com"
                      style={{
                        width: "100%",
                        paddingLeft: "2.5rem",
                        paddingRight: "0.75rem",
                        paddingTop: "0.625rem",
                        paddingBottom: "0.625rem",
                        fontSize: "0.875rem",
                        backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                        borderColor: errors.email
                          ? "#dc2626"
                          : isDarkMode
                          ? "#4b5563"
                          : "#d1d5db",
                        borderWidth: "1px",
                        borderStyle: "solid",
                        borderRadius: "0.375rem",
                        color: isDarkMode ? "#ffffff" : "#111827",
                        outline: "none",
                      }}
                      onFocus={(e) => {
                        if (!errors.email) {
                          e.target.style.borderColor = "#27AE60";
                          e.target.style.boxShadow =
                            "0 0 0 2px rgba(39, 174, 96, 0.2)";
                        }
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.email
                          ? "#dc2626"
                          : isDarkMode
                          ? "#4b5563"
                          : "#d1d5db";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  {errors.email && (
                    <p
                      style={{
                        marginTop: "0.25rem",
                        fontSize: "0.75rem",
                        color: "#dc2626",
                      }}
                    >
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <Label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: isDarkMode ? "#f3f4f6" : "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Phone Number <span style={{ color: "#dc2626" }}>*</span>
                  </Label>
                  <div style={{ position: "relative" }}>
                    <Phone
                      style={{
                        position: "absolute",
                        left: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "1rem",
                        height: "1rem",
                        color: isDarkMode ? "#9ca3af" : "#6b7280",
                      }}
                    />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="(123) 456-7890"
                      style={{
                        width: "100%",
                        paddingLeft: "2.5rem",
                        paddingRight: "0.75rem",
                        paddingTop: "0.625rem",
                        paddingBottom: "0.625rem",
                        fontSize: "0.875rem",
                        backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                        borderColor: errors.phone
                          ? "#dc2626"
                          : isDarkMode
                          ? "#4b5563"
                          : "#d1d5db",
                        borderWidth: "1px",
                        borderStyle: "solid",
                        borderRadius: "0.375rem",
                        color: isDarkMode ? "#ffffff" : "#111827",
                        outline: "none",
                      }}
                      onFocus={(e) => {
                        if (!errors.phone) {
                          e.target.style.borderColor = "#27AE60";
                          e.target.style.boxShadow =
                            "0 0 0 2px rgba(39, 174, 96, 0.2)";
                        }
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.phone
                          ? "#dc2626"
                          : isDarkMode
                          ? "#4b5563"
                          : "#d1d5db";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  {errors.phone && (
                    <p
                      style={{
                        marginTop: "0.25rem",
                        fontSize: "0.75rem",
                        color: "#dc2626",
                      }}
                    >
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Vehicle (Optional) */}
                <div>
                  <Label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: isDarkMode ? "#f3f4f6" : "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Vehicle Information{" "}
                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      (Optional)
                    </span>
                  </Label>
                  <div style={{ position: "relative" }}>
                    <Car
                      style={{
                        position: "absolute",
                        left: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "1rem",
                        height: "1rem",
                        color: isDarkMode ? "#9ca3af" : "#6b7280",
                      }}
                    />
                    <input
                      type="text"
                      value={formData.vehicle}
                      onChange={(e) => handleChange("vehicle", e.target.value)}
                      placeholder="e.g., Toyota Camry 2020"
                      style={{
                        width: "100%",
                        paddingLeft: "2.5rem",
                        paddingRight: "0.75rem",
                        paddingTop: "0.625rem",
                        paddingBottom: "0.625rem",
                        fontSize: "0.875rem",
                        backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                        borderColor: isDarkMode ? "#4b5563" : "#d1d5db",
                        borderWidth: "1px",
                        borderStyle: "solid",
                        borderRadius: "0.375rem",
                        color: isDarkMode ? "#ffffff" : "#111827",
                        outline: "none",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#27AE60";
                        e.target.style.boxShadow =
                          "0 0 0 2px rgba(39, 174, 96, 0.2)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = isDarkMode
                          ? "#4b5563"
                          : "#d1d5db";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                </div>

                {/* License (Optional) */}
                <div>
                  <Label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: isDarkMode ? "#f3f4f6" : "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Driver's License{" "}
                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      (Optional)
                    </span>
                  </Label>
                  <div style={{ position: "relative" }}>
                    <CreditCard
                      style={{
                        position: "absolute",
                        left: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "1rem",
                        height: "1rem",
                        color: isDarkMode ? "#9ca3af" : "#6b7280",
                      }}
                    />
                    <input
                      type="text"
                      value={formData.license}
                      onChange={(e) => handleChange("license", e.target.value)}
                      placeholder="e.g., DL-12345"
                      style={{
                        width: "100%",
                        paddingLeft: "2.5rem",
                        paddingRight: "0.75rem",
                        paddingTop: "0.625rem",
                        paddingBottom: "0.625rem",
                        fontSize: "0.875rem",
                        backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                        borderColor: isDarkMode ? "#4b5563" : "#d1d5db",
                        borderWidth: "1px",
                        borderStyle: "solid",
                        borderRadius: "0.375rem",
                        color: isDarkMode ? "#ffffff" : "#111827",
                        outline: "none",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#27AE60";
                        e.target.style.boxShadow =
                          "0 0 0 2px rgba(39, 174, 96, 0.2)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = isDarkMode
                          ? "#4b5563"
                          : "#d1d5db";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    justifyContent: "flex-end",
                    marginTop: "0.5rem",
                  }}
                >
                  <Button
                    type="button"
                    onClick={handleClose}
                    variant="outline"
                    style={{
                      backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                      borderColor: isDarkMode ? "#4b5563" : "#d1d5db",
                      color: isDarkMode ? "#f3f4f6" : "#374151",
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    style={{
                      backgroundColor: "#27AE60",
                      color: "#ffffff",
                    }}
                  >
                    Add Driver
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}