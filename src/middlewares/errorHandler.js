const errorHandler = (error, _, res, __) => {

  if (error.name === "ValidationError" && Array.isArray(error.inner)) {
    const errors = error.inner.map((err) => ({
      field: err.path,
      message: err.message,
    }));

    return res.status(400).json({
      message: "Validation error",
      errors,
    });
  }

  const { status = 500, message, errors } = error;

  res.status(status).json({
    message,
    errors: errors || null,
  });
};

export default errorHandler;
