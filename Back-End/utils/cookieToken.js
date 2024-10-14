const cookieToken = (user, res) => {
  const token = user.getJwtToken();

  // Remove password before sending the response
  user.password = undefined;

  // Send the token in the response body
  res.status(200).json({
    success: true,
    token,
    user,
  });
};

module.exports = cookieToken;
